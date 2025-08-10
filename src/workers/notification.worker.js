// notification.worker.js
import { Worker } from 'bullmq';
// import Redis from 'ioredis';
import { RedisMock } from '../common/utils/redis-mock.util.js';
import { notificationJobHandler } from './notification.worker-mock.js';

let notificationWorker = null;

if (process.env.REDIS_URL) {
  // Real worker
  const connection = new Redis(process.env.REDIS_URL);
  notificationWorker = new Worker('notifications', notificationJobHandler, { connection });
} else {
  // Mock worker
  console.warn('[NOTIFICATION WORKER MOCK] Using in-process worker');
  notificationWorker = {
    async addJob(jobName, data) {
      return notificationJobHandler({ name: jobName, data });
    }
  };
}

export { notificationWorker };
