import prisma from '../../prisma-client.js';
import puppeteer from 'puppeteer';
import slugify from 'slugify';
import { generateAgreementPreview } from '../../common/services/generate-agreement-preview.service.js'
import { triggerNotification } from '../../modules/notifications/notification.service.js';


import {
  NotFoundError,
  ForbiddenError,
} from '../../common/services/errors-builder.service.js';

export const getAllLandlordAgreements = async ({ landlordId, status, cursor, limit = 10 }) => {
  const where = {
    owner_id: landlordId,
    is_deleted: false,
    ...(status && { status }),
  };

  // Fetch one extra record for nextCursor determination
  const agreements = await prisma.rental_agreements.findMany({
    where,
    include: {
      properties: {
        select: {
          property_name: true,
        },
      },
      property_units: {
        select: {
          unit_number: true,
        },
      },
      users_rental_agreements_tenant_idTousers: {
        select: {
          username: true,
          phone_number: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: Number(limit) + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = agreements.length > limit;
  const slicedAgreements = agreements.slice(0, limit);
  const nextCursor = hasMore ? slicedAgreements[slicedAgreements.length - 1].id : null;

  const formatted = slicedAgreements.map((a) => ({
    agreement_id: a.id,
    property: {
      property_name: a.properties?.property_name || '—',
      unit_number: a.property_units?.unit_number || null,
    },
    applier: a.users_rental_agreements_tenant_idTousers
      ? {
          applier_name: a.users_rental_agreements_tenant_idTousers.username,
          applier_contact: a.users_rental_agreements_tenant_idTousers.phone_number,
        }
      : null,
    status: a.status,
    initiated_at: a.created_at,
  }));

  return {
    results: formatted,
    nextCursor,
    hasMore,
  };
};


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


export const terminateAgreement = async ({ agreementId, landlordId, reason }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId, is_deleted: false },
    include: { properties: true, property_units: true }
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });
  if (agreement.owner_id !== landlordId) throw new ForbiddenError('You are not authorized to terminate this agreement', { field: 'User ID' });
  if (!['pending_payment', 'active'].includes(agreement.status)) {
    throw new ForbiddenError('Only pending or active agreements can be terminated');
  }

  await prisma.$transaction(async (tx) => {
    await tx.rental_agreements.update({
      where: { id: agreementId },
      data: { status: 'terminated', tenant_id: null, updated_at: new Date() }
    });

    if (agreement.properties.has_units && agreement.property_units) {
      await tx.property_units.update({ where: { id: agreement.property_units.id }, data: { status: 'available' } });
    } else {
      await tx.properties.update({ where: { id: agreement.property_id }, data: { status: 'available' } });
    }

    await tx.property_applications.updateMany({
      where: { property_id: agreement.property_id, tenant_id: agreement.tenant_id },
      data: { status: 'rejected', landlord_message: 'Agreement terminated by landlord', reviewed_at: new Date() }
    });
  });

  // 🔔 Notification Service (non-blocking)
  const propertyName = agreement.properties?.name || 'Property';

  if (agreement.tenant_id) {
    void (async () => {
      try {
        await triggerNotification(
          agreement.tenant_id,
          'AGREEMENT_TERMINATED',
          'Your rental agreement has been terminated',
          `Your rental agreement for ${propertyName} has been terminated. Reason: ${reason || 'No reason provided.'}`
        );
      } catch (err) {
        console.error('Failed to send termination notification to tenant:', err);
      }
    })();
  }

  void (async () => {
    try {
      await triggerNotification(
        landlordId,
        'AGREEMENT_TERMINATED',
        'Agreement successfully terminated',
        `You have successfully terminated the agreement for ${propertyName}.`
      );
    } catch (err) {
      console.error('Failed to send termination notification to landlord:', err);
    }
  })();
};




export default {
  getAllLandlordAgreements, 
  generateAgreementShareLink,
  downloadAgreementPdf,
  terminateAgreement,
}