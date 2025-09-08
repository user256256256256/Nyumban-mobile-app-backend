import prisma from '../../prisma-client.js';
import puppeteer from 'puppeteer';
import slugify from 'slugify';
import { generateAgreementPreview } from '../../common/services/generate-agreement-preview.service.js'

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

  if (!isTenant || !isLandlord) {
    throw new ForbiddenError('You do not have access to this agreement', { field: 'User ID' });
  }

  return agreement;

}

export default {
  generateAgreementShareLink,
  downloadAgreementPdf,
  getAgreement,
}