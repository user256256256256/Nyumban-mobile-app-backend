import prisma from '../prisma-client.js';
import dayjs from 'dayjs';
import { triggerNotification } from '../modules/notifications/notification.service.js';

export const alertUpcomingExpirations = async () => {
  const now = new Date();
  const alertDate = dayjs(now).add(3, 'day').endOf('day').toDate();

  console.log(
    `[DEBUG] Checking promotions expiring between NOW=${now.toISOString()} and ALERT_DATE=${alertDate.toISOString()}`
  );

  const soonToExpire = await prisma.property_promotions.findMany({
    where: {
      end_date: {
        gte: now,
        lte: alertDate,
      },
      status: 'active',
      is_deleted: false,
    },
    select: {
      id: true,
      property_id: true,
      properties: {
        select: {
          owner_id: true,
          property_name: true,
        },
      },
      end_date: true,
    },
  });

  console.log(
    `[DEBUG] Found ${soonToExpire.length} promotion(s) expiring within 3 days`
  );

  if (soonToExpire.length === 0) return;

  for (const promo of soonToExpire) {
    const landlordId = promo.properties?.owner_id;
    const propertyTitle = promo.properties?.property_name || 'your property';
    const daysLeft = dayjs(promo.end_date).diff(dayjs(now), 'day');

    console.log(
      `[DEBUG] PromoID=${promo.id} Property="${propertyTitle}" EndDate=${promo.end_date.toISOString()} DaysLeft=${daysLeft}`
    );

    if (landlordId && [1, 2, 3].includes(daysLeft)) {
      try {
        console.log(
          `[DEBUG] Sending reminder to Landlord=${landlordId} for Property="${propertyTitle}" expiring in ${daysLeft} day(s)`
        );

        await triggerNotification(
          landlordId,
          'user',
          'Promotion Expiry Reminder',
          `The promotion for ${propertyTitle} will expire in ${daysLeft} day(s). Consider renewing to keep it active.`
        );

        console.log(`[SUCCESS] Notification sent for PromoID=${promo.id}`);
      } catch (err) {
        console.error(
          `[ERROR] Failed to send expiry alert for promotion ${promo.id}:`,
          err
        );
      }
    } else {
      console.log(
        `[DEBUG] Skipped PromoID=${promo.id} — landlordId=${landlordId}, daysLeft=${daysLeft}`
      );
    }
  }

  console.log(
    `[${new Date().toISOString()}] ⚠️ Finished sending expiry alerts for ${soonToExpire.length} promotion(s)`
  );
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
      properties: {
        select: {
          owner_id: true,
          property_name: true,
        },
      },
    },
  });

  if (!expiredPromotions.length) return;

  const updates = expiredPromotions.map((promo) =>
    prisma.property_promotions.update({
      where: { id: promo.id },
      data: { status: 'expired', updated_at: new Date() },
    })
  );

  const propertyUpdates = expiredPromotions.map((promo) =>
    prisma.properties.update({
      where: { id: promo.property_id },
      data: { is_promoted: false, updated_at: new Date() },
    })
  );

  await prisma.$transaction([...updates, ...propertyUpdates]);

  // Send notifications
  for (const promo of expiredPromotions) {
    const landlordId = promo.properties?.owner_id;
    const propertyTitle = promo.properties?.property_name || 'your property';

    if (landlordId) {
      try {
        await triggerNotification(
          landlordId,
          'user',
          'Promotion Expired',
          `The promotion for ${propertyTitle} has expired. You can renew it to keep your property highlighted.`
        );
      } catch (err) {
        console.error(`Failed to send notification for promotion ${promo.id}:`, err);
      }
    }
  }

  console.log(`[${new Date().toISOString()}] ✅ Expired ${expiredPromotions.length} promotion(s)`);
};


