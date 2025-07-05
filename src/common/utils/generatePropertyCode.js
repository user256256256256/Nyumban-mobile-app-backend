import { randomBytes } from 'crypto';
import prisma from '../../prisma-client.js'; // adjust path as needed

const generateRandomCode = (districtCode, type) => {
  const district = districtCode?.substring(0, 3).toUpperCase() || 'DST';
  const typeCode = type?.substring(0, 3).toUpperCase() || 'PRP';
  const shortId = randomBytes(2).toString('hex').toUpperCase(); // e.g., 'A3F1'
  return `${district}-${typeCode}-${shortId}`;
};

export const generateUniquePropertyCode = async (districtCode, type) => {
  let code;
  let exists = true;

  while (exists) {
    code = generateRandomCode(districtCode, type);
    exists = await prisma.properties.findUnique({
      where: { property_code: code }
    });
  }

  return code;
};
