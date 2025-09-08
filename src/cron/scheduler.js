import cron from 'node-cron';
import { expirePromotions, alertUpcomingExpirations } from '../cron/promotion-expiry.cron.js';
import { permanentlyDeleteExpiredUsers } from '../cron/delete-user-permanently.cron.js';
import { permanentlyDeleteOldNotifications } from '../cron/delete-notifications-permanently.cron.js';
import { finalizeExpiredEvictions } from '../cron/finalize-expired-evictions.cron.js';
import { finalizeExpiredOwnerRequirements } from './finalize-owner-requirements.cron.js';
import { finalizeExpiredMutualAgreements } from './finalize-mutual-agreement.cron.js'

// Every 5 mins — promotions
cron.schedule('*/5 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled promotion expiry check...`);
  try {
    await expirePromotions();
  } catch (error) {
    console.error('Error during scheduled promotion expiry:', error);
  }
});

// Daily at 3:00 AM — user cleanup
cron.schedule('0 3 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running user deletion cleanup...`);
  try {
    await permanentlyDeleteExpiredUsers();
  } catch (error) {
    console.error('Error during user cleanup cron:', error);
  }
});

// Weekly on Sunday at 4:00 AM — notification cleanup
cron.schedule('0 4 * * 0', async () => {
  console.log(`[${new Date().toISOString()}] Running notification deletion cleanup...`);
  try {
    await permanentlyDeleteOldNotifications();
  } catch (error) {
    console.error('Error during notification cleanup cron:', error);
  }
});

// Run alert once daily at 9 AM
cron.schedule('0 9 * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running scheduled promotion expiry alert check...`);
  try {
    await alertUpcomingExpirations();
  } catch (error) {
    console.error('Error during promotion expiry alert cron:', error);
  }
});

// Run once per day at midnight
cron.schedule('0 0 * * *', async () => {
  console.log(`[${new Date().toISOString()}] CRON: Auto-finalize expired evictions`);
  try {
    await finalizeExpiredEvictions();
  } catch (error) {
    console.error('Error finalizing expired evictions:', error);
  }
});

// Run once per day at midday
cron.schedule('0 12 * * *', async () => {
  console.log(`[${new Date().toISOString()}] CRON: Auto-finalize owner requirement evictions`);
  try {
    await finalizeExpiredOwnerRequirements();
  } catch (error) {
    console.error('Error finalizing owner requirement eviction:', error);
  }
});

// Run once per day at midday
cron.schedule('0 12 * * *', async () => {
  console.log(`[${new Date().toISOString()}] CRON: Auto-finalize mutual agreement evictions`);
  try {
    await finalizeExpiredMutualAgreements();
  } catch (error) {
    console.error('Error finalizing mutual agreement eviction:', error);
  }
});