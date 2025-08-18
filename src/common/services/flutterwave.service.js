import { v4 as uuidv4 } from 'uuid';
import prisma from '../../prisma-client.js';

export const simulateFlutterwavePropertyPromotionPayment = async (planId, price, currency, phoneNumber ) => {

  const payment = await prisma.payments.create({
    data: {
      id: uuidv4(),
      method: 'Flutterwave',
      status: 'successful', 
      amount: price,
      payment_type: 'PROPERTY_PROMOTION',
      transaction_id: `FW_${Date.now()}`,
      currency: currency, // default is UGX 
      metadata: JSON.stringify({ planId, phoneNumber }), // ✅ Stringify object
    },
    select: {
      id: true
    }
  });

  const paymentId = payment.id

  return { paymentId } 
};


export const simulateFlutterwaveVerificationBadgePayment = async ({ amount,  metadata = {}, }) => {
  const payment = await prisma.payments.create({
    data: {
      id: uuidv4(),
      method: 'Flutterwave',
      status: 'successful',
      amount,
      payment_type: 'ACCOUNT_VERIFICATION',
      transaction_id: `FW_${Date.now()}`,
      currency: 'UGX',
      metadata: JSON.stringify(metadata),
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
