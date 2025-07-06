import cron from 'node-cron';
import { expirePromotions } from '../cron/promotion-expiry.cron.js';

cron.schedule('*/5 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled promotion expiry check...`);
  try {
    await expirePromotions();
  } catch (error) {
    console.error('Error during scheduled promotion expiry:', error);
  }
});
