import { Queue } from 'bullmq';
// import Redis from 'ioredis';

let notificationQueue = null;

// ===============================
// Redis Queue Initialization
// ===============================
if (process.env.REDIS_URL) {
  const connection = new Redis(process.env.REDIS_URL);
  notificationQueue = new Queue('notifications', { connection });
} else {
  // If Redis is missing, provide a mock queue
  console.warn('[NOTIFICATION QUEUE MOCK] Queue not started. Redis is not configured.');
  notificationQueue = {
    async add() {
      console.warn('[MOCK QUEUE] Notification job skipped (no Redis).');
      return { id: 'mock-job' };
    }
  };
}

export { notificationQueue };
