import { ServerError } from '../../common/services/errors-builder.service.js';
import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';

export const finalizeRentalAgreementTermination = async ({ agreement, timestamp = new Date(), notify = true }) => {
  if (!agreement) throw new ServerError('Agreement object is required');

  // 1️⃣ Update agreement status
  const updatedAgreement = await prisma.rental_agreements.update({
    where: { id: agreement.id },
    data: {
      status: 'terminated',
      updated_at: timestamp,
      termination_effective_date: timestamp,
      termination_confirmed_at: timestamp,
    },
  });

  // Update security deposit status if it exisits 
  const securityDeposit = await prisma.rental_agreements.findUnique({
    where: { id: agreement.id }
  })

  if (securityDeposit) {
    await prisma.security_deposits.update({
      data: {
        status: 'forfeited'
      }
    })
  }

  // 2️⃣ Cancel pending/unpaid rent payments
  const cancelledPayments = await prisma.rent_payments.updateMany({
    where: {
      rental_agreement_id: agreement.id,
      status: { in: ['pending', 'overdued', 'partial'] },
    },
    data: { status: 'cancelled', updated_at: timestamp },
  });

  // 3️⃣ Free property
  if (agreement.property_id) {
    const freedProperty = await prisma.properties.update({
      where: { id: agreement.property_id },
      data: { status: 'available', updated_at: timestamp },
    });
  }

  // 4️⃣ Free unit if property has units
  if (agreement.properties?.has_units && agreement.property_units?.id) {
    const freedUnit = await prisma.property_units.update({
      where: { id: agreement.property_units.id },
      data: { status: 'available', updated_at: timestamp },
    });
  }

  // 5️⃣ Notifications
  if (notify) {
    if (agreement.users_rental_agreements_tenant_idTousers?.id) {
      void triggerNotification(
        agreement.users_rental_agreements_tenant_idTousers.id,
        'user',
        'Agreement Terminated',
        'Your rental agreement has been terminated and the property/unit is now available leave the property. '
      );
    }
    if (agreement.users_rental_agreements_owner_idTousers?.id) {
      void triggerNotification(
        agreement.users_rental_agreements_owner_idTousers.id,
        'user',
        'Agreement Terminated',
        'You have successfully terminated the rental agreement.'
      );
    }
  }

};
