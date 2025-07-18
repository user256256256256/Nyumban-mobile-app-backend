import { v4 as uuidv4 } from 'uuid';
import prisma from '../../prisma-client.js';

export const simulateFlutterwavePropertyPromotionPayment = async ({ userId, planId, phoneNumber }) => {
  const plan = await prisma.promotion_plans.findUnique({ where: { plan_id: planId } });
  if (!plan) throw new NotFoundError('Promotion plan not found.');

  const payment = await prisma.payments.create({
    data: {
      id: uuidv4(),
      method: 'Flutterwave',
      status: 'successful', 
      amount: plan.price,
      payment_type: 'PROPERTY_PROMOTION',
      transaction_id: `FW_${Date.now()}`,
      currency: plan.currency || 'UGX',
      metadata: { planId, phoneNumber },
    },
  });

  return { payment, plan };
};


export const simulateFlutterwaveVerificationBadgePayment = async ({userId, payment_type, amount, currency = 'UGX', metadata = {}, }) => {
  const payment = await prisma.payments.create({
    data: {
      id: uuidv4(),
      method: 'Flutterwave',
      status: 'successful',
      amount,
      payment_type,
      transaction_id: `FW_${Date.now()}`,
      currency,
      metadata,
    },
  });

  return payment;
};

export const simulateFlutterwaveRentPayment = async ({
  userId,
  agreementId,
  amount,
  currency = 'UGX',
  metadata = {},
}) => {
  const payment = await prisma.payments.create({
    data: {
      id: uuidv4(),
      method: 'Flutterwave',
      status: 'successful',
      amount,
      payment_type: 'RENT_PAYMENT',
      transaction_id: `FW_RENT_${Date.now()}`,
      currency,
      metadata: {
        agreementId,
        ...metadata,
      },
    },
  });

  return payment;
};
