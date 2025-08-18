import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { simulateFlutterwavePropertyPromotionPayment } from '../../common/services/flutterwave.service.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const checkLandlordVerificationStatus = async (userId) => {
  const landlordProfile = await prisma.landlord_profiles.findUnique({
    where: { user_id: userId },
    select: { is_verified: true }
  });

  if (!landlordProfile) throw new NotFoundError('Landlord profile not found');

  if (!landlordProfile.is_verified) {
    return { verified: landlordProfile.is_verified, message: 'Account not verified to promote properties'};
  }

  return { verified: landlordProfile.is_verified,  message: 'Landlord account verified for promotions'};
};

export const getPromotionPlans = async () => {
  const plans = await prisma.promotion_plans.findMany({
    where: { is_deleted: false },
    select: {
      plan_id: true,
      duration_days: true,
      price: true,
      currency: true,
    },
    orderBy: { duration_days: 'asc' },
  });

  return plans;
}

export const promoteProperty = async (
  userId,
  propertyId,
  planId,
  phoneNumber
) => {
  // 1️⃣ Fetch property details
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    select: { owner_id: true, is_verified: true },
  });

  if (!property) throw new NotFoundError("Property not found.");
  if (property.owner_id !== userId) throw new ForbiddenError("Unauthorized.");
  if (!property.is_verified) {
    throw new ForbiddenError("Property must be verified before promotion.");
  }

  const plan = await prisma.promotion_plans.findUnique({
    where: { plan_id: planId },
    select: {
      price: true,
      currency: true,
      plan_id: true,
      duration_days: true,
    },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found", { field: "Plan ID" });
  }

  // 3️⃣ Check for an existing active promotion
  const activePromotion = await prisma.property_promotions.findFirst({
    where: {
      property_id: propertyId,
      status: "active",
      is_deleted: false,
    },
    include: {
      payments: true,
    },
  });

  if (activePromotion) {
    const currentPlanId = activePromotion.payments?.metadata
      ? JSON.parse(activePromotion.payments.metadata).planId
      : null;
    const currentDurationDays = activePromotion.duration
      ? parseInt(activePromotion.duration) || 0
      : 0;

    // Same plan check
    if (currentPlanId === planId) {
      throw new ValidationError(
        `This property is already under the same promotion plan until ${activePromotion.end_date.toDateString()}.`,
        { field: "Plan Id" }
      );
    }

    // Duration-based tier check
    if (currentDurationDays >= plan.duration_days) {
      throw new AuthError(
        `A higher or equal-duration promotion is already active until ${activePromotion.end_date.toDateString()}.`
      );
    }

    // Expire the old promotion
    await prisma.property_promotions.update({
      where: { id: activePromotion.id },
      data: {
        status: "expired",
        updated_at: new Date(),
      },
    });
  }

  // 4️⃣ Simulate payment
  const { paymentId } = await simulateFlutterwavePropertyPromotionPayment(
    plan.plan_id,
    plan.price,
    plan.currency,
    phoneNumber
  );

  if (!paymentId) {
    throw new ServerError("Failed to initiate flutterwave payment", {
      field: "Flutterwave payment",
    });
  }

  const start = new Date();
  const end = new Date(Date.now() + 1 * 60 * 1000); // 1 minute from now FOR TESTING PURPOSES
  //  const end = new Date(start.getTime() + plan.duration_days * 24 * 60 * 60 * 1000); // USE When in PRODUCTION
  
  console.log('Start:', start.toISOString(), 'End:', end.toISOString());
  
  await prisma.property_promotions.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      property_id: propertyId,
      start_date: start,
      end_date: end,
      status: "active",
      price: plan.price,
      duration: `${plan.duration_days} days`,
      payment_id: paymentId,
    },
  });
  

  // 7️⃣ Update property status
  await prisma.properties.update({
    where: { id: propertyId },
    data: { is_promoted: true, updated_at: new Date() },
  });

  return {
    property_id: propertyId,
    status: "promoted",
    promotion_end_date: end.toISOString(),
  };
};

export const getPropertyPromotionStatus = async  (userId, propertyId) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    select: { owner_id: true },
  });

  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });
  if (property.owner_id !== userId) throw new AuthError('Unauthorized.', { field: 'User ID' });

  const activePromotion = await prisma.property_promotions.findFirst({
    where: {
      property_id: propertyId,
      status: 'active',
      is_deleted: false,
    },
    select: {
      start_date: true,
      end_date: true,
      price: true,
      duration: true,
    },
  });

  if (!activePromotion) return { status: 'not_promoted' };

  return {
    status: 'active',
    start_date: activePromotion.start_date,
    end_date: activePromotion.end_date,
    price: activePromotion.price,
    duration: activePromotion.duration,
  };
}

export default {
  checkLandlordVerificationStatus,
  getPromotionPlans,
  promoteProperty,
  getPropertyPromotionStatus,
};