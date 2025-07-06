import prisma from '../prisma-client.js';

export const expirePromotions = async () => {
  const now = new Date();

  const expiredPromotions = await prisma.property_promotions.findMany({
    where: {
      end_date: { lt: now },
      status: 'active', 
      is_deleted: false,
    },
    select: {
      id: true,
      property_id: true,
    },
  });

  if (expiredPromotions.length === 0) return;

  const updates = expiredPromotions.map((promo) => {
    return prisma.property_promotions.update({
      where: { id: promo.id },
      data: {
        status: 'expired', 
        updated_at: new Date(),
      },
    });
  });

  const propertyUpdates = expiredPromotions.map((promo) => {
    return prisma.properties.update({
      where: { id: promo.property_id },
      data: {
        is_promoted: false,
        updated_at: new Date(),
      },
    });
  });

  await prisma.$transaction([...updates, ...propertyUpdates]);
  console.log(`[${new Date().toISOString()}] ✅ Expired ${expiredPromotions.length} promotion(s)`);
};
