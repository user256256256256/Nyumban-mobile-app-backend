import { triggerNotification } from '../notifications/notification.service.js';
import dayjs from 'dayjs';

/**
 * Send tenant notification
 */
export async function notifyTenant({
  tenantId,
  amount,
  paymentType,
  monthsCovered,
  propertyName,
  unitNumber,
  paymentMethod,
  coveredPeriods,
  paymentDate,
  remainingBalance
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');
    let statusText =
      paymentType === 'advance'
        ? `covering ${monthsCovered} month(s) in advance`
        : paymentType === 'paid'
        ? 'Full (completed)'
        : 'Partial';

    const periodsText = coveredPeriods?.length
      ? coveredPeriods.map(p => `- ${dayjs(p.start).format('MMM D, YYYY')} to ${dayjs(p.end).format('MMM D, YYYY')}${p.partial ? ' (Partial)' : ''}`).join('\n')
      : 'N/A';

    const message = `
Hello,

Your landlord has recorded a rent payment for Unit ${unitNumber}, ${propertyName}.

Payment Details:
- Amount Paid: $${amount.toFixed(2)}
- Payment Date: ${formattedDate}
- Payment Method: ${paymentMethod}
- Period Covered:
${periodsText}
- Payment Status: ${statusText}
${paymentType !== 'advance' ? `- Remaining Balance: $${remainingBalance.toFixed(2)}` : ''}
`;

    console.log('[notifyTenant] Sending notification:', message.trim());
    await triggerNotification(tenantId, 'user', 'Manual Rent Payment Recorded', message.trim());
  } catch (err) {
    console.error('[notifyTenant] Failed:', err);
  }
}

/**
 * Send landlord notification
 */
export async function notifyLandlord({
  landlordId,
  tenantName,
  amount,
  paymentType,
  monthsCovered,
  propertyName,
  unitNumber,
  paymentMethod,
  coveredPeriods,
  paymentDate
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');
    let statusText =
      paymentType === 'advance'
        ? `covering ${monthsCovered} month(s) in advance`
        : paymentType === 'paid'
        ? 'Full (completed)'
        : 'Partial';

    const periodsText = coveredPeriods?.length
      ? coveredPeriods.map(p => `- ${dayjs(p.start).format('MMM D, YYYY')} to ${dayjs(p.end).format('MMM D, YYYY')}${p.partial ? ' (Partial)' : ''}`).join('\n')
      : 'N/A';

    const message = `
Hello,

A rent payment has been recorded for Tenant ${tenantName} in Unit ${unitNumber}, ${propertyName}.

Payment Details:
- Amount Paid: $${amount.toFixed(2)}
- Payment Date: ${formattedDate}
- Payment Method: ${paymentMethod}
- Period Covered:
${periodsText}
- Payment Status: ${statusText}
`;

    console.log('[notifyLandlord] Sending notification:', message.trim());
    await triggerNotification(landlordId, 'user', 'Tenant Rent Payment Recorded', message.trim());
  } catch (err) {
    console.error('[notifyLandlord] Failed:', err);
  }
}

/**
 * Tenant notification for initial rent + security deposit
 */
export async function notifyTenantManualInitialRentPayment({
  tenantId,
  rentAmount,
  securityDeposit,
  paymentMethod,
  paymentDate,
  propertyName,
  unitNumber,
  coveredPeriods = [],
  partialPayment = null,
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');

    const coverageLines = coveredPeriods.map(p => {
      const range = `${dayjs(p.start).format('MMM D, YYYY')} - ${dayjs(p.end).format('MMM D, YYYY')}`;
      return p.partial ? `- Partial month covered: ${range}` : `- Full month covered: ${range}`;
    }).join('\n');

    const message = `
Hello,

Your landlord has recorded your initial payment for Unit ${unitNumber || 'N/A'}, ${propertyName || 'the property'}.

Payment Breakdown:
- Rent Paid: $${rentAmount.toFixed(2)}
- Security Deposit: $${securityDeposit.toFixed(2)}
- Total Paid: $${(rentAmount + securityDeposit).toFixed(2)}
- Payment Method: ${paymentMethod}
- Payment Date: ${formattedDate}

Coverage:
${coverageLines}

${partialPayment ? `Outstanding for next month: $${partialPayment.amount.toFixed(2)}` : ''}

Thank you for completing your initial payment.
`;

    await triggerNotification(tenantId, 'user', 'Initial Rent Payment Recorded', message.trim());
  } catch (err) {
    console.error('[notifyTenantManualInitialRentPayment] Failed:', err);
  }
}

/**
 * Landlord notification for tenant's initial payment
 */
export async function notifyLandlordManualInitialRentPayment({
  landlordId,
  tenantName,
  rentAmount,
  securityDeposit,
  paymentMethod,
  paymentDate,
  propertyName,
  unitNumber,
  coveredPeriods = [],
  partialPayment = null,
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');

    const coverageLines = coveredPeriods.map(p => {
      const range = `${dayjs(p.start).format('MMM D, YYYY')} - ${dayjs(p.end).format('MMM D, YYYY')}`;
      return p.partial ? `- Partial month covered: ${range}` : `- Full month covered: ${range}`;
    }).join('\n');

    const message = `
Hello,

Tenant ${tenantName} has completed their initial payment for Unit ${unitNumber || 'N/A'}, ${propertyName || 'the property'}.

Payment Breakdown:
- Rent Paid: $${rentAmount.toFixed(2)}
- Security Deposit: $${securityDeposit.toFixed(2)}
- Total Paid: $${(rentAmount + securityDeposit).toFixed(2)}
- Payment Method: ${paymentMethod}
- Payment Date: ${formattedDate}

Coverage:
${coverageLines}

${partialPayment ? `Outstanding for next month: $${partialPayment.amount.toFixed(2)}` : ''}

The rental agreement is now active.
`;

    await triggerNotification(landlordId, 'user', 'Tenant Initial Rent Payment Recorded', message.trim());
  } catch (err) {
    console.error('[notifyLandlordManualInitialRentPayment] Failed:', err);
  }
}

/**
 * Tenant notification for simulated initial rent + security deposit
 */
export async function notifyTenantInitialRentPayment({
  tenantId,
  rentAmount,
  securityDeposit,
  paymentMethod,
  paymentDate,
  propertyName,
  unitNumber,
  coveredPeriods = [],
  partialPayment = null,
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');

    const coverageLines = coveredPeriods.map((p, index) => {
      const range = `${dayjs(p.start).format('MMM D, YYYY')} - ${dayjs(p.end).format('MMM D, YYYY')}`;
      return p.partial
        ? `- Partial month covered: ${range}`
        : `- Month ${index + 1} fully covered: ${range}`;
    }).join('\n');

    const totalPaid = rentAmount + securityDeposit;
    const nextOutstanding = partialPayment ? partialPayment.amount.toFixed(2) : '0.00';

    const message = `
Hello,

Your initial payment for Unit ${unitNumber || 'N/A'}, ${propertyName || 'the property'} has been received successfully.

Payment Breakdown:
- Rent Paid: $${rentAmount.toFixed(2)}
- Security Deposit: $${securityDeposit.toFixed(2)}
- Total Paid: $${totalPaid.toFixed(2)}
- Payment Method: ${paymentMethod}
- Payment Date: ${formattedDate}

Coverage Periods:
${coverageLines}

${partialPayment ? `Outstanding for next month: $${nextOutstanding}` : ''}

Thank you for completing your initial payment. Your rental agreement is now active.
`;

    await triggerNotification(tenantId, 'user', 'Initial Rent Payment Confirmed', message.trim());
  } catch (err) {
    console.error('[notifyTenantInitialRentPayment] Failed:', err);
  }
}

/**
 * Landlord notification for tenant's simulated initial payment
 */
export async function notifyLandlordInitialRentPayment({
  landlordId,
  tenantName,
  rentAmount,
  securityDeposit,
  paymentMethod,
  paymentDate,
  propertyName,
  unitNumber,
  coveredPeriods = [],
  partialPayment = null,
}) {
  try {
    const formattedDate = dayjs(paymentDate).format('MMM D, YYYY');

    const coverageLines = coveredPeriods.map((p, index) => {
      const range = `${dayjs(p.start).format('MMM D, YYYY')} - ${dayjs(p.end).format('MMM D, YYYY')}`;
      return p.partial
        ? `- Partial month covered: ${range}`
        : `- Month ${index + 1} fully covered: ${range}`;
    }).join('\n');

    const totalPaid = rentAmount + securityDeposit;
    const nextOutstanding = partialPayment ? partialPayment.amount.toFixed(2) : '0.00';

    const message = `
Hello,

Tenant ${tenantName} has successfully made their initial payment for Unit ${unitNumber || 'N/A'}, ${propertyName || 'the property'}.

Payment Breakdown:
- Rent Paid: $${rentAmount.toFixed(2)}
- Security Deposit: $${securityDeposit.toFixed(2)}
- Total Paid: $${totalPaid.toFixed(2)}
- Payment Method: ${paymentMethod}
- Payment Date: ${formattedDate}

Coverage Periods:
${coverageLines}

${partialPayment ? `Outstanding for next month: $${nextOutstanding}` : ''}

The rental agreement is now active.
`;

    await triggerNotification(landlordId, 'user', 'Tenant Initial Rent Payment Confirmed', message.trim());
  } catch (err) {
    console.error('[notifyLandlordInitialRentPayment] Failed:', err);
  }
}
