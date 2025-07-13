import prisma from '../src/prisma-client.js';
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';

/* 
To execute the seed file:
- Uncomment the seed codes if applicabel
- Cmd: node prisma/seed.js

Ensure package.json includes:
"prisma": {
  "seed": "node prisma/seed.js"
}
*/

async function main() {
  
  /*

  const templatePath = path.resolve('./prisma/agreement-template.html')
  const templateHtml = fs.readFileSync(templatePath, 'utf-8')

  await prisma.rental_agreement_templates.upsert({
    where: { id: uuidv4() }, 
    update: {},
    create: {
      id: uuidv4(),
      name: 'Default Ugandan Rental Agreement Template',
      template_html: templateHtml,
    }
  })

  console.log('✅ Agreement template seeded successfully')

  // === Seed of user_roles === //
  const userRoles = [
    {
      id: '6ffd6c3f-edc4-49b2-95ed-16afd487dc83',
      role: 'tenant'
    },
    {
      id: 'fea4ae77-2828-405c-9485-1d9eed1c15cb',
      role: 'landlord'
    },
  ]

  for (const role of userRoles) {
    await prisma.user_roles.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        role: role.role,
      }
    })
  }

  console.log('✅ Seeded user roles');
  
  // === Existing Slide & Role Logic ===

  const tenantRoleId = '6ffd6c3f-edc4-49b2-95ed-16afd487dc83';
  const landlordRoleId = 'fea4ae77-2828-405c-9485-1d9eed1c15cb';

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

    await prisma.slide_role_assignments.deleteMany({
      where: { slide_id: slide.id },
    });

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

  // === Seed of Property Promotions === //
  const promotionPlans = [
    {
      plan_id: 'promo_7d',
      duration_days: 7,
      price: new Decimal(5000),
      currency: 'UGX',
    },
    {
      plan_id: 'promo_14d',
      duration_days: 14,
      price: new Decimal(9000),
      currency: 'UGX',
    },
    {
      plan_id: 'promo_30d',
      duration_days: 30,
      price: new Decimal(17000),
      currency: 'UGX',
    },
  ];

  for (const plan of promotionPlans) {
    await prisma.promotion_plans.upsert({
      where: { plan_id: plan.plan_id },
      update: {
        duration_days: plan.duration_days,
        price: plan.price,
        currency: plan.currency,
        is_deleted: false,
        updated_at: new Date(),
      },
      create: {
        id: uuidv4(),
        plan_id: plan.plan_id,
        duration_days: plan.duration_days,
        price: plan.price,
        currency: plan.currency,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  console.log('✅ Seeded promotion plans');

    const adminRoleId = uuidv4();
  const adminUserId = uuidv4();

   // 1. Create "admin" role
   await prisma.user_roles.create({
    data: {
      id: adminRoleId,
      role: 'admin',
    },
  });

  // 2. Create user "Asia Hasny"
  await prisma.users.create({
    data: {
      id: adminUserId,
      username: 'asia hasny',
      email: 'asiahasny@example.com',
      phone_number: '+256709487467',
      is_email_confirmed: true,
      is_phone_number_confirmed: true,
      is_profile_complete: true,
      created_at: new Date(),
      active_role: 'admin',
    },
  });

    // 3. Assign "admin" role to Asia Hasny
    await prisma.user_role_assignments.create({
      data: {
        id: uuidv4(),
        user_id: adminUserId,
        role_id: adminRoleId,
      },
    });
    
    console.log('✅ Seeded admin role and user');

  */

}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});
