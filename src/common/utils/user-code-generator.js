import { randomBytes } from 'crypto';
import prisma from '../../prisma-client.js';

const generateRandomCode = (prefix) => {
  const shortId = randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${shortId}`;
};

export const generateUniqueLandlordCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generateRandomCode('LLD');
    exists = await prisma.landlord_profiles.findUnique({
      where: { landlord_code: code }
    });
  }

  return code;
};

export const generateUniqueTenantCode = async () => {
  let code;
  let exists = true;

  while (exists) {
    code = generateRandomCode('TNT');
    exists = await prisma.tenant_profiles.findUnique({
      where: { tenant_code: code }
    });
  }

  return code;
};
