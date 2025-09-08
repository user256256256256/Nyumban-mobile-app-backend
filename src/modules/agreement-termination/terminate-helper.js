import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';

/**
 * Finalize termination for a rental agreement:
 * 1️⃣ Update agreement status
 * 2️⃣ Free property & unit (if applicable)
 * 3️⃣ Cancel pending/unpaid rent payments
 * 4️⃣ Send notifications if provided
 *
 * @param {Object} params
 * @param {Object} params.agreement - Rental agreement object (include tenant, landlord, unit, properties)
 * @param {Date} [params.timestamp=new Date()] - Timestamp for updates
 * @param {boolean} [params.notify=true] - Whether to trigger notifications
 */
export const finalizeRentalAgreementTermination = async ({ agreement, timestamp = new Date(), notify = true }) => {
  if (!agreement) throw new Error('Agreement object is required');

  // 1️⃣ Update agreement status
  await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      status: 'terminated',
      updated_at: timestamp,
      termination_effective_date: timestamp,
      termination_confirmed_at: timestamp,
    },
  });

  // 2️⃣ Cancel pending/unpaid rent payments
  await prisma.rent_payments.updateMany({
    where: { rental_agreement_id: agreement.id, status: { in: ['pending', 'overdued', 'partial'] } },
    data: { status: 'cancelled', updated_at: timestamp },
  });

  // 3️⃣ Free property
  if (agreement.property_id) {
    await prisma.properties.update({
      where: { id: agreement.property_id },
      data: { status: 'available', updated_at: timestamp },
    });
  }

  // 4️⃣ Free unit if property has units
  if (agreement.properties?.has_units && agreement.unit?.id) {
    await prisma.property_units.update({
      where: { id: agreement.unit.id },
      data: { status: 'available', updated_at: timestamp },
    });
  }

  // 5️⃣ Notifications
  if (notify) {
    if (agreement.tenant?.id) {
      void triggerNotification(
        agreement.tenant.id,
        'user',
        'Agreement Terminated',
        'Your rental agreement has been terminated and the property/unit is now available.'
      );
    }
    if (agreement.landlord?.id) {
      void triggerNotification(
        agreement.landlord.id,
        'user',
        'Agreement Terminated',
        'You have successfully terminated the rental agreement.'
      );
    }
  }
};
