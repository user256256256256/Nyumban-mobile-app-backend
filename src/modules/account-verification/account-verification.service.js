import prisma from '../../prisma-client.js';
import { uploadToStorage } from '../../common/services/s3.service.js'
import { v4 as uuidv4 } from 'uuid';
import { simulateFlutterwaveVerificationBadgePayment } from '../../common/services/flutterwave.service.js'

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
      user_id: userId,
      is_deleted: false,
    },
    orderBy: {
      created_at: 'desc',
    },
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
    where: {
      owner_id: userId,
      is_verified: true,
      is_deleted: false,
    },
    select: {
      id: true,
      property_name: true,
    },
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
  if (!file) throw new NotFoundError('Proof document is required', {field: 'File'})
  
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
  })

  return { id: record.id, status: record.status };
}

export const getPropertyVerificationStatus = async (userId, propertyId) => {
  const property = await prisma.properties.findFirst({ where: { id: propertyId, owner_id: userId, is_deleted: false }, })
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' })
    
  return {
    property_id: propertyId,
    property_name: property.property_name,
    verification_status: property.is_verified,
  }
}

export const reviewVerificationRequest = async ({ requestId, status, review_notes, adminId }) => {
  const updated = await prisma.account_verification_requests.update({
    where: { id: requestId },
    data: {
      status,
      comment: review_notes,
      verified_by: adminId,
      verification_date: new Date(),
      updated_at: new Date()
    },
    include: { users: true }
  });

  // 🔔 Non-blocking notification
  const title = status === 'approved'
    ? 'Verification Request Approved'
    : 'Verification Request Rejected';

  const body = status === 'approved'
    ? 'Your verification request has been approved. Please proceed with the payment to get your verification badge.'
    : `Your verification request was rejected. ${review_notes || 'Please review your submission or contact support for assistance.'}`;

  void (async () => {
    try {
      await triggerNotification(updated.user_id, 'VERIFICATION_REVIEW', title, body);
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  return {
    request_id: updated.id,
    status: updated.status,
    message:
      status === 'approved'
        ? 'Proceed to payment to get verification badge.'
        : 'Sorry, review your submission or contact us for guidance.'
  };
};



export const submitVerificationBadgePayment = async ({ userId, phone_number, amount, currency }) => {
  const payment = await simulateFlutterwaveVerificationBadgePayment({
    userId,
    payment_type: 'ACCOUNT_VERIFICATION',
    amount,
    currency,
    metadata: { phone_number },
  });

  const request = await prisma.account_verification_requests.findFirst({
    where: { user_id: userId, status: 'approved', payment_id: null, is_deleted: false },
    orderBy: { created_at: 'desc' },
  });

  if (!request) throw new NotFoundError('Approved verification request not found for this user.', { field: request });

  await prisma.account_verification_requests.update({
    where: { id: request.id },
    data: { payment_id: payment.id },
  });

  await prisma.landlord_profiles.updateMany({
    where: { user_id: userId },
    data: { is_verified: true },
  });

  await prisma.properties.updateMany({
    where: { owner_id: userId },
    data: { is_verified: true },
  });

  void (async () => {
    try {
      await triggerNotification(
        userId,
        'VERIFICATION_PAYMENT_SUCCESS',
        'Verification Badge Payment Successful',
        'Your payment for the verification badge was successful. Your account and properties are now verified.'
      );
    } catch (err) {
      console.error('Failed to send notification:', err);
    }
  })();

  return {
    message: 'Verification badge payment successful',
    verification_badge_status: 'approved',
    properties_verified: true,
  };
};


export const updateVerificationRequest = async ({ userId, ownership_comment, file }) => {
  const request = await prisma.account_verification_requests.findFirst({
    where: {
      user_id: userId,
      is_deleted: false,
    },
    orderBy: { created_at: 'desc' },
  });

  if (!request) {
    throw new NotFoundError('Verification request not found for this user', { field: 'User ID' });
  }

  // ✅ Lock update if already finalized
  if (['approved', 'rejected'].includes(request.status)) {
    throw new ForbiddenError('Cannot update a finalized verification request.', {
      field: 'Verification Request Status',
    });
  }

  // Upload new file if provided
  let filePath = request.proof_of_ownership_file_path;
  if (file) {
    filePath = await uploadToStorage(file.buffer, file.originalname);
  }

  const updated = await prisma.account_verification_requests.update({
    where: { id: request.id },
    data: {
      proof_of_ownership_file_path: filePath,
      comment: ownership_comment ?? request.comment,
      updated_at: new Date(),
    },
  });

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