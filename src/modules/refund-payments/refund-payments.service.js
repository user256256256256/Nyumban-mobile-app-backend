import prisma from '../../prisma-client.js';
import { NotFoundError, ForbiddenError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';
import { simulateSecurityDepositRefund, simulateAdvanceRentRefund } from '../../common/services/flutterwave.service.js';

export const refund = async ({ agreementId, landlordId, landlordPhone, reason, description }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId, is_deleted: false },
    include: { rent_payments: true, properties: true },
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID'});
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('Unauthorized', { field: 'Landlord ID'});

  const depositAmount = parseFloat(agreement.security_deposit || 0);

  // Check advance payments
  const advancePayments = agreement.rent_payments.filter(
    (p) => p.status === 'completed' && p.due_date > new Date()
  );
  if (advancePayments.length > 0 && reason === 'advance_rent') {
    // Simulate advance rent refund
    const payment = await simulateAdvanceRentRefund({
      tenantId: agreement.tenant_id,
      agreementId,
      amount: advancePayments.reduce((acc, p) => acc + parseFloat(p.due_amount || 0), 0),
      reason: description || 'Advance rent refund',
    });

    return {
      success: true,
      message: 'Advance rent refund initiated successfully',
      transactionId: payment.transaction_id,
    };
  }

  if (depositAmount <= 0 && reason === 'security_deposit') {
    throw new ForbiddenError('No refundable security deposit exists');
  }

  // Simulate security deposit refund
  const payment = await simulateSecurityDepositRefund({
    tenantId: agreement.tenant_id,
    propertyId: agreement.property_id,
    amount: depositAmount,
    reason: description || 'Security deposit refund',
  });

  // Flag deposit as refunded
  if (reason === 'security_deposit') {
    await prisma.rental_agreements.update({
      where: { id: agreementId },
      data: { security_deposit: '0' },
    });
  }

  // Notify tenant
  await triggerNotification(
    agreement.tenant_id,
    'user',
    'Refund initiated',
    `A refund of ${reason === 'security_deposit' ? depositAmount : 'advance rent'} UGX has been initiated. Reason: ${description || reason}`
  );

  return {
    success: true,
    message: `${reason === 'security_deposit' ? 'Security deposit' : 'Advance rent'} refund initiated successfully`,
    transactionId: payment.transaction_id,
  };
};

export default { refund };
