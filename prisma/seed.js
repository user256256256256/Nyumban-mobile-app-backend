import prisma from '../src/prisma-client.js';
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid';
import { Decimal } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';

/* 
To execute the seed file:
- Uncomment the seed codes if applicabel
- Run Cmd: node prisma/seed.js

Ensure package.json includes:
"prisma": {
  "seed": "node prisma/seed.js"
}
*/

async function main() {


  const propertyTypes = ['apartment', 'house', 'condo', 'studio'];
  const currencies = ['UGX'];
  const statuses = ['available', 'occupied', 'archived', 'reserved'];
  
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function randomDecimal(min, max) {
    return new Decimal((Math.random() * (max - min) + min).toFixed(2));
  }
  
  const OWNER_ID = '0ae678c8-09e4-4c75-b495-665bf6dde7e2';
  const TENANT_ID = '56140da1-9010-4466-a9b2-8b80d0bff87b';
  
  console.log('🌱 Seeding database with test properties...');
  
  const propertiesToCreate = Array.from({ length: 100 }).map(() => {
    const likes = randomInt(0, 50);
    const saves = randomInt(0, 30);
    const views = randomInt(10, 200);
  
    return {
      id: uuidv4(),
      owner_id: OWNER_ID,
      property_name: `Test Property ${Math.random().toString(36).substring(7)}`,
      property_type: propertyTypes[randomInt(0, propertyTypes.length - 1)],
      property_code: uuidv4().slice(0, 8),
      likes,
      saves,
      views, // new property column
      has_units: false,
      is_promoted: Math.random() < 0.2, // 20% promoted
      is_verified: Math.random() < 0.5, // 50% verified
      country: 'Kenya',
      address: `Random Street ${randomInt(1, 500)}`,
      price: randomDecimal(200, 2000),
      currency: currencies[randomInt(0, currencies.length - 1)],
      bedrooms: randomInt(1, 5),
      bathrooms: randomInt(1, 3),
      year_built: randomInt(1990, 2022),
      parking_spaces: randomInt(0, 3),
      thumbnail_image_path: `https://picsum.photos/seed/${uuidv4()}/300/200`,
      status: statuses[randomInt(0, statuses.length - 1)],
      description: 'This is a seeded test property for ranking feed testing.',
      created_at: dayjs().subtract(randomInt(0, 30), 'day').toDate(),
      is_deleted: false,
      application_requests: randomInt(0, 20),
      tour_requests: randomInt(0, 15),
      amenities: ['wifi', 'pool', 'gym'].slice(0, randomInt(1, 3)),
    };
  });
  
  for (const property of propertiesToCreate) {
    const created = await prisma.properties.create({ data: property });
  
    // attach random engagements for this property
    const engagements = Array.from({ length: randomInt(2, 5) }).map(() => ({
      id: uuidv4(),
      user_id: TENANT_ID, // ⚠️ random user
      property_id: created.id,
      liked: Math.random() < 0.5,
      saved: Math.random() < 0.3,
    }));
  
    await prisma.property_engagements.createMany({
      data: engagements,
    });
  
    console.log(`✅ Seeded property ${created.id} with ${engagements.length} engagements`);
  }
  
  console.log('🎉 Seeding complete!');
  /*


      // === Seed Rental Agreement Template ===
      const templateId = uuidv4();
    
      const templatePath = path.resolve('./prisma/agreement-template.html');
      const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  
      await prisma.rental_agreement_templates.upsert({
        where: { id: templateId },
        update: { template_html: templateHtml, updated_at: new Date() },
        create: {
          id: templateId,
          name: 'Default Ugandan Rental Agreement Template',
          template_html: templateHtml,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
  
      console.log('✅ Agreement template seeded');

    // === Seed Rental Agreement Template ===
    const templateId = uuidv4();
    
    const templatePath = path.resolve('./prisma/agreement-template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf-8');

    await prisma.rental_agreement_templates.upsert({
      where: { id: templateId },
      update: { template_html: templateHtml, updated_at: new Date() },
      create: {
        id: templateId,
        name: 'Default Ugandan Rental Agreement Template',
        template_html: templateHtml,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    console.log('✅ Agreement template seeded');

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
      image_url: 'https://cdn.nyumbanapp.com/slides/payment.png',
      roles: ['tenant'],
    },
    {
      id: uuidv4(),
      title: 'Book Property Tours',
      description: 'Schedule and manage visits to properties directly in-app.',
      image_url: 'https://cdn.nyumbanapp.com/slides/tours.png',
      roles: ['tenant'],
    },
    {
      id: uuidv4(),
      title: 'Sign Agreements Online',
      description: 'Digitally sign agreements using DocuSign integration.',
      image_url: 'https://cdn.nyumbanapp.com/slides/signing.png',
      roles: ['tenant', 'landlord'],
    },
    {
      id: uuidv4(),
      title: 'Manage Listings',
      description: 'Create, update, and track your property listings in one place.',
      image_url: 'https://cdn.nyumbanapp.com/slides/listings.png',
      roles: ['landlord'],
    },
    {
      id: uuidv4(),
      title: 'View Tenant Applications',
      description: 'Easily review and approve rental applications submitted by tenants.',
      image_url: 'https://cdn.nyumbanapp.com/slides/applications.png',
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

    // Upsert a device token for that user
    const userId = '56140da1-9010-4466-a9b2-8b80d0bff87b';

      // Upsert the user
      await prisma.users.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          username: 'mockuser',
          email: 'mockuser@example.com',
          phone_number: '+1234567890',
          is_email_confirmed: true,
          is_phone_number_confirmed: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });


    await prisma.device_tokens.upsert({
      where: { endpoint_arn: 'mock-endpoint-1234' },
      update: {
        device_token: 'mock-device-token-xyz',
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        id: uuidv4(),
        user_id: userId,
        device_token: 'mock-device-token-xyz',
        endpoint_arn: 'mock-endpoint-1234',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

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
