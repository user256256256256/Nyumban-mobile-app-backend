import prisma from '../../prisma-client.js';
import { uploadToStorage } from '../../common/services/s3.service.js'
import { v4 as uuidv4 } from 'uuid';
import { simulateFlutterwaveVerificationBadgePayment } from '../../common/services/flutterwave.service.js'
import { triggerNotification } from '../notifications/notification.service.js'

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const getAccountVerificationStatus = async (userId) => {
  const landlordProfile = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId },
    select: { is_verified: true }
  });

  if (!landlordProfile) throw new NotFoundError('Landlord profile not found', { field: 'User ID' });

  const verificationRequest = await prisma.account_verification_requests.findFirst({
    where: {
      user_id,
      is_deleted: false,
      status: { not: 'outdated' },
    },
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      status: true,
      verification_date: true,
      comment: true,
      payment_id: true,
      proof_of_ownership_file_path: true,
      created_at: true,
      updated_at: true,
    },
  });

  const verifiedProperties = await prisma.properties.findMany({
    where: { owner_id: userId, is_verified: true, is_deleted: false },
    select: { id: true, property_name: true },
  });

  return {
    is_verified: landlordProfile.is_verified,
    verification_request: verificationRequest || null,
    verified_properties: {
      count: verifiedProperties.length,
      list: verifiedProperties,
    },
  };
};

export const submitVerificationRequest = async (userId, comment, file) => {
  if (!file) throw new NotFoundError('Proof document is required', { field: 'File' });

  const existingRequest = await prisma.account_verification_requests.findFirst({
    where: {
      user_id,
      status: { in: ['pending', 'rejected'] },
      is_deleted: false
    },
  });

  if (existingRequest) {
    throw new ForbiddenError(
      `You already have a verification request with status "${existingRequest.status}". Please wait for it to be resolved before submitting a new one.`,
      { field: 'Verification Request Status' }
    );
  }

  const url = await uploadToStorage(file.buffer, file.originalname);

  const record = await prisma.account_verification_requests.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      comment,
      proof_of_ownership_file_path: url,
      status: 'pending',
      created_at: new Date()
    }
  });

  return { id: record.id, status: record.status };
};

export const getPropertyVerificationStatus = async (userId, propertyId) => {
  const property = await prisma.properties.findFirst({ where: { id: propertyId, owner_id: userId, is_deleted: false }, })
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' })
    
  return {
    property_id: propertyId,
    property_name: property.property_name,
    is_property_verified: property.is_verified,
  }
}

export const reviewVerificationRequest = async ({ requestId, status, review_notes, adminId }) => {
  const adminUser = await prisma.users.findUnique({ where: { id: adminId } });
  if (!adminUser) throw new NotFoundError('Admin not found', { field: 'User ID' });

  const existingVerification = await prisma.account_verification_requests.findUnique({ where: { id: requestId } });
  if (!existingVerification) throw new NotFoundError('Verification request not found', { field: 'Request ID' });
  if (existingVerification.status === 'approved') throw new AuthError('Verification request already approved');

  const updated = await prisma.account_verification_requests.update({
    where: { id: requestId },
    data: {
      status,
      comment: review_notes,
      verified_by: adminId,
      verification_date: new Date(),
      updated_at: new Date()
    }
  });

  // Mark older approved requests as outdated
  if (status === 'approved') {
    await prisma.account_verification_requests.updateMany({
      where: {
        user_id: existingVerification.user_id,
        status: 'approved',
        id: { not: requestId },
        is_deleted: false
      },
      data: { status: 'outdated' }
    });
  }

  // 🔔 Notification
  const title = status === 'approved'
    ? 'Verification Request Approved'
    : 'Verification Request Rejected';

  const body = status === 'approved'
    ? 'Your verification request has been approved. Please proceed with the payment to get your verification badge.'
    : `Your verification request was rejected. ${review_notes || 'Please review your submission or contact support for assistance.'}`;

  void triggerNotification(updated.user_id, 'user', title, body);

  return {
    request_id: updated.id,
    message: `Resolved submission request for the user with status ${updated.status}`
  };
};

export const submitVerificationBadgePayment = async ({ userId, phone_number }) => {
  // 1️⃣ Find latest approved and non-outdated verification request without payment
  const request = await prisma.account_verification_requests.findFirst({
    where: { user_id: userId, status: 'approved', payment_id: null, is_deleted: false },
    orderBy: { created_at: 'desc' },
  });

  if (!request) throw new NotFoundError('Approved verification request not found for this user.', { field: 'Request ID' });

  const amount = 55500;

  // 2️⃣ Create simulated payment
  const payment = await simulateFlutterwaveVerificationBadgePayment({
    amount,
    metadata: { phone_number, userId: userId },
  });

  // 3️⃣ Link payment to request
  const updatedRequest = await prisma.account_verification_requests.update({
    where: { id: request.id },
    data: { payment_id: payment.id },
  });

  // 4️⃣ Mark landlord + properties as verified
  await prisma.landlord_profiles.updateMany({ where: { user_id: userId }, data: { is_verified: true } });
  await prisma.properties.updateMany({ where: { owner_id: userId }, data: { is_verified: true } });

  // 5️⃣ Notification
  void triggerNotification(
    userId,
    'user',
    'Verification Badge Payment Successful',
    'Your payment for the verification badge was successful. Your account and properties are now verified.'
  );

  return {
    message: 'Verification badge payment successful',
    verification_badge_status: updatedRequest.status,
    request_id: updatedRequest.id,
    properties_verified: true,
    payment: {
      id: payment.id,
      method: payment.method,
      transaction_id: payment.transaction_id,
      amount: payment.amount,
      currency: payment.currency,
    },
  };
};

export const updateVerificationRequest = async ({ userId, requestId, ownership_comment, file }) => {
  // 🔎 Find the existing request
  const existingVerification = await prisma.account_verification_requests.findUnique({
    where: { id: requestId },
  });

  if (!existingVerification || existingVerification.user_id !== userId) {
    throw new NotFoundError('Verification request not found', { field: 'Request ID' });
  }

  // 🚫 Lock update if already finalized or outdated
  if (['approved', 'outdated'].includes(existingVerification.status)) {
    throw new ForbiddenError(
      `Cannot update a ${existingVerification.status} verification request.`,
      { field: 'Verification Request Status' }
    );
  }

  // 📤 Upload new file if provided
  let filePath = existingVerification.proof_of_ownership_file_path;
  if (file) {
    filePath = await uploadToStorage(file.buffer, file.originalname);
  }

  // 📝 Update request
  const updated = await prisma.account_verification_requests.update({
    where: { id: requestId },
    data: {
      proof_of_ownership_file_path: filePath,
      comment: ownership_comment ?? existingVerification.comment,
      updated_at: new Date(),
    },
  });

  // 🔔 Non-blocking notification
  void (async () => {
    try {
      await triggerNotification(
        userId,
        'user',
        'Verification Request Updated',
        'Your verification request has been updated and is awaiting admin review.'
      );
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  return {
    request_id: updated.id,
    message: 'Verification request updated. Awaiting admin review.',
  };
};

export default {
    getAccountVerificationStatus,
    submitVerificationRequest,
    getPropertyVerificationStatus,
    reviewVerificationRequest,
    submitVerificationBadgePayment,
    updateVerificationRequest,
}