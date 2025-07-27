import prisma from '../../prisma-client.js';
import slugify from 'slugify';
import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';

import {
  NotFoundError,
  AuthError,
  ServerError,
  ForbiddenError,
} from '../../common/services/errors-builder.service.js';

export const getAllLandlordAgreements = async ({
  landlordId,
  sortBy,
  order,
  status,
  limit,
  offset
}) => {
  const sortFieldMap = {
    date: 'created_at',
    status: 'status',
    property_name: 'properties.property_name'
  };

  const sortField = sortFieldMap[sortBy] || 'created_at';

  const where = {
    owner_id: landlordId,
    is_deleted: false,
    ...(status && { status })
  };

  const [agreements, total] = await Promise.all([
    prisma.rental_agreements.findMany({
      where,
      include: {
        properties: {
          select: {
            property_name: true
          }
        },
        property_units: {
          select: {
            unit_number: true
          }
        },
        users_rental_agreements_tenant_idTousers: {
          select: {
            username: true,
            phone_number: true
          }
        }
      },
      orderBy: {
        [sortField]: order
      },
      skip: offset,
      take: limit
    }),

    prisma.rental_agreements.count({ where })
  ]);

  const formatted = agreements.map((a) => ({
    agreement_id: a.id,
    property: {
      property_name: a.properties?.property_name || '—',
      unit_number: a.property_units?.unit_number || null
    },
    applier: a.users_rental_agreements_tenant_idTousers
      ? {
          applier_name: a.users_rental_agreements_tenant_idTousers.username,
          applier_contact: a.users_rental_agreements_tenant_idTousers.phone_number
        }
      : null,
    file_path: a.file_path,
    status: a.status,
    initiated_at: a.created_at
  }));

  return {
    total,
    limit,
    offset,
    agreements: formatted
  };
};

export const generateAgreementShareLink = async ({ agreementId }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId, is_deleted: false },
    include: {
      properties: {
        select: { property_name: true, }
      }
    },
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });

  const slug = slugify(agreement.properties?.property_name || 'agreement', {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });

  const shareUrl = `${process.env.BASE_URL}/agreements/${slug}-${agreementId}`;

  return {
    property_name: agreement.properties?.property_name,
    agreement_id: agreementId,
    share_link: shareUrl,
    file_path: agreement.file_path,
  };
};

export const downloadAgreementPdf = async ({ agreementId }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId, is_deleted: false },
    select: { file_path: true }
  });

  if (!agreement || !agreement.file_path) {
    throw new NotFoundError('Agreement document not found', { field: 'Agreement ID' });
  }

  // Assuming file_path is a server-relative path or full CDN URL
  const isRemote = agreement.file_path.startsWith('http');

  if (isRemote) {
    // Optionally: Stream from URL if hosted externally (e.g., S3 or CDN)
    // Not implemented here — suggest redirect or streaming via proxy
    throw new NotFoundError('Remote PDF streaming not supported in this demo.');
  } else {
    const pdfPath = path.resolve('public/uploads/agreements', agreement.file_path); // adjust if needed

    if (!fs.existsSync(pdfPath)) throw new NotFoundError('Agreement file not found on server');

    return createReadStream(pdfPath);
  }
};

export const terminateAgreement = async ({ agreementId, landlordId, reason }) => {
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId, is_deleted: false },
    select: {
      id: true,
      status: true,
      owner_id: true,
      tenant_id: true,
    }
  });

  if (!agreement) throw new NotFoundError('Agreement not found', { field: 'Agreement ID' });

  if (agreement.owner_id !== landlordId) {
    throw new ForbiddenError('You are not authorized to terminate this agreement', { field: 'User ID' });
  }

  if (agreement.status !== 'completed') {
    throw new Error('Only completed agreements can be terminated');
  }

  // Update agreement status to "terminated"
  await prisma.rental_agreements.update({
    where: { id: agreementId },
    data: {
      status: 'terminated',
      updated_at: new Date(),
    }
  });

  // Optionally notify tenant (extend with notification service or email logic)
  if (agreement.tenant_id) {
    // Example: triggerNotification(agreement.tenant_id, "Your agreement has been terminated", reason);
    console.log(`Notifying tenant (${agreement.tenant_id}) of termination.`);
  }

  return;
};

export default {
  getAllLandlordAgreements, 
  generateAgreementShareLink,
  downloadAgreementPdf,
  terminateAgreement,
}