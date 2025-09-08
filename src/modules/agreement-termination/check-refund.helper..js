import { ForbiddenError } from '../../common/services/errors-builder.service.js';
/**
 * Checks if refundable amounts exist for an agreement.
 * Refundable amounts = security deposit + advance rent (future payments).
 *
 * @param {Object} agreement - Rental agreement object with rent_payments included.
 * @param {Date} [now=new Date()] - Current timestamp reference.
 * @returns {void} - Throws ForbiddenError if refunds exist, otherwise returns silently.
 */
export const checkRefundsOrThrow = (agreement, now = new Date()) => {
  const securityDeposit = parseFloat(agreement.security_deposit || 0);

  const advanceRentPayments = agreement.rent_payments?.filter(
    (p) => p.status === 'completed' && p.due_date > now
  ) || [];

  const refundMessages = [];
  if (securityDeposit > 0) {
    refundMessages.push(`security deposit: ${securityDeposit}`);
  }

  if (advanceRentPayments.length > 0) {
    const totalAdvance = advanceRentPayments.reduce(
      (acc, p) => acc + parseFloat(p.due_amount || 0),
      0
    );
    refundMessages.push(`advance rent: ${totalAdvance}`);
  }

  if (refundMessages.length > 0) {
    throw new ForbiddenError(
      `Cannot finalize termination: refundable amounts exist. Please clear ${refundMessages.join(' and ')} first.`
    );
  }
};
