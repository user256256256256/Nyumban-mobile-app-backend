import prisma from '../prisma-client.js';
import dayjs from 'dayjs';

export const alertUpcomingExpirations = async (daysBefore = 3) => {
  const now = new Date();
  const alertDate = dayjs(now).add(daysBefore, 'day').toDate();

  const soonToExpire = await prisma.property_promotions.findMany({
    where: {
      end_date: {
        gte: now,        // End date is in the future but...
        lte: alertDate,  // ...within the alert window
      },
      status: 'active',
      is_deleted: false,
    },
    select: {
      id: true,
      property_id: true,
      property: {
        select: {
          owner_id: true,
          title: true,
        },
      },
      end_date: true,
    },
  });

  if (soonToExpire.length === 0) return;

  for (const promo of soonToExpire) {
    const landlordId = promo.property?.owner_id;
    const propertyTitle = promo.property?.title || 'your property';
    const daysLeft = dayjs(promo.end_date).diff(dayjs(now), 'day');

    if (landlordId) {
      try {
        await triggerNotification(
          landlordId,
          'PROMOTION_EXPIRY_ALERT',
          'Promotion Expiry Reminder',
          `The promotion for ${propertyTitle} will expire in ${daysLeft} day(s). Consider renewing to keep it active.`
        );
      } catch (err) {
        console.error(`Failed to send expiry alert for promotion ${promo.id}:`, err);
      }
    }
  }

  console.log(`[${new Date().toISOString()}] ⚠️ Sent expiry alerts for ${soonToExpire.length} promotion(s)`);
};


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
      property: {           // Fetch landlord information
        select: {
          owner_id: true,
          title: true,
        },
      },
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

  // 🔔 Send notifications to landlords
  for (const promo of expiredPromotions) {
    const landlordId = promo.property?.owner_id;
    const propertyTitle = promo.property?.title || 'your property';

    if (landlordId) {
      void (async () => {
        try {
          await triggerNotification(
            landlordId,
            'PROMOTION_EXPIRED',
            'Promotion Expired',
            `The promotion for ${propertyTitle} has expired. You can renew it to keep your property highlighted.`
          );
        } catch (err) {
          console.error(`Failed to send notification for promotion ${promo.id}:`, err);
        }
      })();
    }
  }

  console.log(`[${new Date().toISOString()}] ✅ Expired ${expiredPromotions.length} promotion(s)`);
};

