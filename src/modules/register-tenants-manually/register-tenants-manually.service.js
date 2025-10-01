import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js';

import {
    NotFoundError,
    AuthError,
    ForbiddenError,
} from '../../common/services/errors-builder.service.js';

export const registerTenantManually = async  ({ landlordId, tenantId, agreementId }) => {
    // 1. Validate tenant
    const tenant = await prisma.users.findUnique({
      where: { id: tenantId, is_deleted: false },
      include: { tenant_profiles: true },
    });
    if (!tenant) throw new NotFoundError('Tenant not found', { field: 'Tenant ID'});

    // 2. Validate agreement
    const agreement = await prisma.rental_agreements.findUnique({
      where: { id: agreementId },
      include: { properties: true },
    });
    if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID'});

    if (!agreement.status === 'ready') throw new ForbiddenError('Agreement not ready to assign tenant', { field: 'Agreement Status'})

    if (agreement.owner_id !== landlordId)
      throw new ForbiddenError('You are not authorized to manage this agreement');

    // 3. Attach tenant to agreement
    const updatedAgreement = await prisma.rental_agreements.update({
      where: { id: agreementId },
      data: {
        tenant_id: tenantId,
        status: 'ready', 
        updated_at: new Date(),
      },
    });

    // 4. Update property/unit status
    if (agreement.unit_id) {
      await prisma.property_units.update({
        where: { id: agreement.unit_id },
        data: { status: 'reserved' },
      });
    } else {
      await prisma.properties.update({
        where: { id: agreement.property_id },
        data: { status: 'reserved' },
      });
    }

    // 5. Notify tenant to accept agreement
    void (async () => {
      try {
        await triggerNotification(
          tenantId,
          'user',
          'Agreement assigned',
          `You have been assigned to a rental agreement for property "${agreement.properties?.name || ''}". Please review and accept the agreement.`
        );
      } catch (err) {
        console.error('Failed to notify tenant:', err);
      }
    })();

    return {
      tenant: {
        id: tenant.id,
        email: tenant.email,
        username: tenant.username,
      },
      agreement: updatedAgreement,
    };
}

export default {
    registerTenantManually
};
