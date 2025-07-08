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
} from '../../common/services/errors.js';

export const getAccountVerificationStatus = async (userId) => {
  const landlordProfile = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId },
    select: { is_verified: true }
  });

  if (!landlordProfile) throw new NotFoundError('Landlord profile not found');

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

export const submitVerificationRequest = async (userId, comment, fullNames, file) => {
  if (!file) throw new NotFoundError('Proof document is required', {field: 'file'})
  
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

  await prisma.landlord_profiles.updateMany({
    where: { user_id: userId },
    data: { full_names: fullNames }
  });

  return { id: record.id, status: record.status };
}

export const getPropertyVerificationStatus = async (userId, propertyId) => {
  const property = await prisma.properties.findFirst({ where: { id: propertyId, owner_id: userId, is_deleted: false }, })
  if (!property) throw new NotFoundError('Property not found')
  
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
      status: status,
      comment: review_notes,
      verified_by: adminId,
      verification_date: new Date(),
      updated_at: new Date()
    }
  });

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
  const payment = await simulateFlutterwaveVerificationBadgePayment({ userId, payment_type: 'ACCOUNT_VERIFICATION', amount, currency, metadata: { phone_number }, });

  const request = await prisma.account_verification_requests.findFirst({
    where: { user_id: userId, status: 'approved', payment_id: null, is_deleted: false, },
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

  return {
    message: 'Verification badge payment successful',
    verification_badge_status: 'approved',
    properties_verified: true,
  };
};


export default {
    getAccountVerificationStatus,
    submitVerificationRequest,
    getPropertyVerificationStatus,
    reviewVerificationRequest,
    submitVerificationBadgePayment
}