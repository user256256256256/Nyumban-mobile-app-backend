import prisma from '../../prisma-client.js';
import puppeteer from 'puppeteer';
import slugify from 'slugify';
import { generateAgreementPreview } from '../../common/services/generate-agreement-preview.service.js'
import { ForbiddenError, NotFoundError, ServerError, AuthError } from '../../common/services/errors-builder.service.js';

export const generateAgreementShareLink = async ({ agreementId }) => {
    const agreement = await prisma.rental_agreements.findUnique({
      where: { id: agreementId, is_deleted: false },
      include: {
        properties: {
          select: { property_name: true }
        }
      },
    });
  
    if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  
    const slug = slugify(agreement.properties?.property_name || 'agreement', {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  
    const shareUrl = `${process.env.BASE_URL}/agreements/${slug}-${agreementId}`;
  
    return {
      property_name: agreement.properties?.property_name,
      agreement_id: agreementId,
      share_link: shareUrl,
    };
};
  
export const downloadAgreementPdf = async ({ agreementId }) => {
    const agreement = await prisma.rental_agreements.findUnique({
      where: { id: agreementId, is_deleted: false },
      include: {
        properties: true,
        users_rental_agreements_tenant_idTousers: true,
        users_rental_agreements_owner_idTousers: true,
      },
    });
  
    if (!agreement) {
      throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
    }
  
    // Generate the HTML 
    const html = generateAgreementPreview(agreementId); 
  
    // Convert HTML to PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
  
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
  
    return pdfBuffer; // Send this buffer as a file download response
};

export const getAgreement = async (userId, agreementId) => {
  const agreement = await prisma.rental_agreements.findUnique({ where: { id: agreementId } })
  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });

  const isTenant = agreement.tenant_id === userId;
  const isLandlord = agreement.owner_id === userId;

  if (!isTenant && !isLandlord) {
    throw new ForbiddenError('You do not have access to this agreement', { field: 'User ID' });
  }

  return agreement;

}

const ALLOWED_DELETE_STATUSES = ['cancelled', 'terminated', 'draft', 'ready', 'completed'];

export const deleteAgreementsBatch = async (userId, agreementIds) => {
  const agreements = await prisma.rental_agreements.findMany({
    where: {
      id: { in: agreementIds },
      is_deleted: false,
      OR: [
        { tenant_id: userId },
        { owner_id: userId },
      ],
    },
  });

  const allowed = agreements.filter(a => ALLOWED_DELETE_STATUSES.includes(a.status));
  const allowedIds = allowed.map(a => a.id);

  if (allowedIds.length === 0) {
    throw new ForbiddenError('No deletable agreements found');
  }

  // Soft delete all allowed agreements
  await prisma.rental_agreements.updateMany({
    where: { id: { in: allowedIds } },
    data: { is_deleted: true, deleted_at: new Date() },
  });

  // Collect affected property IDs
  const affectedPropertyIds = [...new Set(allowed.map(a => a.property_id))];

  // For each property, check if any active agreements remain (including unit agreements)
  for (const propertyId of affectedPropertyIds) {
    const activePropertyAgreementsCount = await prisma.rental_agreements.count({
      where: {
        property_id: propertyId,
        unit_id: null,
        is_deleted: false,
        status: { notIn: ['cancelled', 'terminated', 'draft', 'ready', 'completed'] },
      },
    });

    const activeUnitAgreementsCount = await prisma.rental_agreements.count({
      where: {
        property_id: propertyId,
        unit_id: { not: null },
        is_deleted: false,
        status: { notIn: ['cancelled', 'terminated', 'draft', 'ready', 'completed'] },
      },
    });

    if (activePropertyAgreementsCount + activeUnitAgreementsCount === 0) {
      await prisma.properties.update({
        where: { id: propertyId },
        data: { has_agreement: false },
      });
    }
  }

  return { deleted_count: allowedIds.length };
};

export const cancelAgreements = async (userId, agreementIds) => {
  const agreements = await prisma.rental_agreements.findMany({
    where: { id: { in: agreementIds }, is_deleted: false },
    include: { properties: true, property_units: true },
  });

  const cancellable = agreements.filter(agreement =>
    (agreement.tenant_id === userId || agreement.owner_id === userId) &&
    ['pending_payment'].includes(agreement.status)
  );

  if (cancellable.length === 0) {
    throw new ForbiddenError('No cancellable agreements found');
  }

  const cancelledResults = await prisma.$transaction(async (tx) => {
    const results = [];

    for (const agreement of cancellable) {
      const updatedAgreement = await tx.rental_agreements.update({
        where: { id: agreement.id },
        data: {
          tenant_id: null,
          tenant_accepted_agreement: false,
          status: 'cancelled',
          start_date: null,
          updated_at: new Date(),
          is_deleted: true,
          deleted_at: new Date(),
        },
      });

      if (agreement.properties.has_units && agreement.property_units) {
        await tx.property_units.update({
          where: { id: agreement.property_units.id },
          data: { status: 'available' },
        });
      } else {
        await tx.properties.update({
          where: { id: agreement.property_id },
          data: { status: 'available' },
        });
      }

      await tx.property_applications.updateMany({
        where: { property_id: agreement.property_id, tenant_id: agreement.tenant_id },
        data: {
          status: 'rejected',
          landlord_message: 'Agreement cancelled by tenant or landlord',
          reviewed_at: new Date(),
        }
      });

      results.push(updatedAgreement);
    }

    return results;
  });

  // 🔔 Notifications (non-blocking)
  for (const agreement of cancellable) {
    const propertyName = agreement.properties?.name || 'Property';

    void (async () => {
      try {
        await triggerNotification(
          agreement.tenant_id,
          'user',
          'Agreement cancelled',
          `Your agreement for ${propertyName} has been cancelled.`
        );
      } catch (err) {
        console.error('Failed to notify tenant on agreement cancellation:', err);
      }
    })();

    void (async () => {
      try {
        await triggerNotification(
          agreement.owner_id,
          'user',
          'Agreement cancelled',
          `You have cancelled the agreement for ${propertyName}.`
        );
      } catch (err) {
        console.error('Failed to notify landlord on agreement cancellation:', err);
      }
    })();
  }

  return {
    cancelled_count: cancelledResults.length,
    cancelled_ids: cancelledResults.map(a => a.id),
  };
};

export const getLeaseAgreement = async (userId, propertyId, unitId = null) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });

  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });

  if (property.has_units && !unitId) {
    throw new NotFoundError('This property has units. Specify a unitId', { field: 'Unit ID' });
  }

  // Check if user is the tenant in an active/completed agreement
  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      unit_id: unitId ?? null,
      tenant_id: userId,
      tenant_accepted_agreement: true,
      status: { in: ['active', 'completed'] },
      is_deleted: false,
    },
    orderBy: { updated_at: 'desc' },
  });

  if (!agreement) {
    throw new NotFoundError('No valid lease agreement found for this property/unit and tenant');
  }

  const rendered_html = await generateAgreementPreview(agreement.id);

  return {
    agreementId: agreement.id,
    property_id: propertyId,
    unit_id: agreement.unit_id ?? null, // ✅ include unit_id if available
    pdf_url: agreement.file_path,
    rendered_html,
  };
};

export const checkAgreementExists = async (userId, propertyId, unitId) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });

  if (property.owner_id !== userId)
    throw new AuthError('Access denied. You are not the owner of this property.', { field: 'Owner ID' });

  if (property.has_units && !unitId)
    throw new ForbiddenError('Property has units, specify the unit to check agreement status', { field: 'Unit ID' });

  if (unitId) {
    const unit = await prisma.property_units.findUnique({ where: { id: unitId } });
    if (!unit || unit.property_id !== propertyId)
      throw new NotFoundError('Unit not found or does not belong to this property', { field: 'Unit ID' });
  }

  const agreement = await prisma.rental_agreements.findFirst({
    where: {
      property_id: propertyId,
      owner_id: userId,
      unit_id: unitId ?? null,
      is_deleted: false,
      status: { in: ['draft', 'ready'] }, // include active agreements
    },
    orderBy: { updated_at: 'desc' },
    select: { id: true, status: true, updated_at: true },
  });

  if (!agreement) return { exists: false };

  return {
    exists: true,
    agreement_id: agreement.id,
    status: agreement.status,
    last_modified: agreement.updated_at,
  };
};

export const permanentlyDeleteAgreementsBatch = async (userId, agreementIds) => {
  // Fetch soft-deleted agreements belonging to user
  const agreements = await prisma.rental_agreements.findMany({
    where: {
      id: { in: agreementIds },
      is_deleted: true,
      OR: [{ tenant_id: userId }, { owner_id: userId }],
    },
  });

  if (agreements.length === 0) {
    throw new ForbiddenError('No deletable agreements found for permanent deletion');
  }

  const deletedIds = agreements.map(a => a.id);

  // Hard delete
  await prisma.rental_agreements.deleteMany({
    where: { id: { in: deletedIds } },
  });

  return { deleted_count: deletedIds.length, deleted_ids: deletedIds };
};

export const recoverDeletedAgreementsBatch = async (userId, agreementIds) => {
  console.log('Recover called with userId:', userId);
  console.log('Recover called with agreementIds:', agreementIds);

  const agreements = await prisma.rental_agreements.findMany({
    where: {
      id: { in: agreementIds },
      is_deleted: true,
      OR: [
        { tenant_id: userId },
        { owner_id: userId }
      ],
    },
  });

  console.log('Agreements fetched for recovery:', agreements);

  // Additional debugging: check DB values individually
  for (const id of agreementIds) {
    const rawAgreement = await prisma.rental_agreements.findUnique({ where: { id } });
    console.log(`DB check for agreement ${id}:`, rawAgreement);
  }

  if (agreements.length === 0) {
    throw new ForbiddenError('No deleted agreements found to recover');
  }

  const recoveredIds = agreements.map(a => a.id);

  await prisma.rental_agreements.updateMany({
    where: { id: { in: recoveredIds } },
    data: { is_deleted: false, deleted_at: null },
  });

  console.log('Agreements recovered:', recoveredIds);

  return { recovered_count: recoveredIds.length, recovered_ids: recoveredIds };
};

export default {
  generateAgreementShareLink,
  downloadAgreementPdf,
  getAgreement,
  deleteAgreementsBatch,
  cancelAgreements,
  checkAgreementExists,
  getLeaseAgreement, 
  permanentlyDeleteAgreementsBatch,
  recoverDeletedAgreementsBatch,
}