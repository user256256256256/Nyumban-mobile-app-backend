import prisma from '../src/prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

/* 

To Execute the seed.js file run in terminal
  Cmd: node prisma/seed.js. 

  Ensure this exists in package.json: 
  "prisma": {
    "seed": "node prisma/seed.js"
  },

*/

async function main() {
  // Insert roles if not exist (assuming roles already seeded)
  const tenantRoleId = '6ffd6c3f-edc4-49b2-95ed-16afd487dc83';
  const landlordRoleId = 'fea4ae77-2828-405c-9485-1d9eed1c15cb';

  // Slide data
  const slides = [
    {
      id: uuidv4(),
      title: 'Easy Rent Payments',
      description: 'Pay your rent seamlessly with integrated payment options.',
      image_url: 'https://cdn.nyumban.com/slides/payment.png',
      roles: ['tenant'],
    },
    {
      id: uuidv4(),
      title: 'Book Property Tours',
      description: 'Schedule and manage visits to properties directly in-app.',
      image_url: 'https://cdn.nyumban.com/slides/tours.png',
      roles: ['tenant'],
    },
    {
      id: uuidv4(),
      title: 'Sign Agreements Online',
      description: 'Digitally sign agreements using DocuSign integration.',
      image_url: 'https://cdn.nyumban.com/slides/signing.png',
      roles: ['tenant', 'landlord'],
    },
    {
      id: uuidv4(),
      title: 'Manage Listings',
      description: 'Create, update, and track your property listings in one place.',
      image_url: 'https://cdn.nyumban.com/slides/listings.png',
      roles: ['landlord'],
    },
    {
      id: uuidv4(),
      title: 'View Tenant Applications',
      description: 'Easily review and approve rental applications submitted by tenants.',
      image_url: 'https://cdn.nyumban.com/slides/applications.png',
      roles: ['landlord'],
    },
  ];

  for (const slide of slides) {
    // Upsert slide
    await prisma.slides.upsert({
      where: { id: slide.id },
      update: {},
      create: {
        id: slide.id,
        title: slide.title,
        description: slide.description,
        image_url: slide.image_url,
        is_active: true,
        is_deleted: false,
      },
    });

    // Delete existing role assignments for this slide to avoid duplicates
    await prisma.slide_role_assignments.deleteMany({
      where: { slide_id: slide.id },
    });

    // Insert slide_role_assignments
    for (const role of slide.roles) {
      const roleId = role === 'tenant' ? tenantRoleId : landlordRoleId;
      await prisma.slide_role_assignments.create({
        data: {
          id: uuidv4(),
          slide_id: slide.id,
          role_id: roleId,
          assigned_at: new Date(),
        },
      });
    }
  }

  console.log('✅ Seeded slides and role assignments');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
