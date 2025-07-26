import cron from 'node-cron';
import { expirePromotions } from '../cron/promotion-expiry.cron.js';
import { permanentlyDeleteExpiredUsers } from '../cron/delete-user-permanently.cron.js'

cron.schedule('*/5 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled promotion expiry check...`);
  try {
    await expirePromotions();
  } catch (error) {
    console.error('Error during scheduled promotion expiry:', error);
  }
});

// It runs once daily at 3:00 AM server time.
cron.schedule('0 3 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running user deletion cleanup...`);
  try {
    await permanentlyDeleteExpiredUsers();
  } catch (error) {
    console.error('Error during user cleanup cron:', error);
  }
});
