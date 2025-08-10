import { Queue } from 'bullmq';
// import Redis from 'ioredis';
import { QueueMock } from '../common/utils/queue-mock.util.js';
import { RedisMock } from '../common/utils/redis-mock.util.js';

let notificationQueue;

if (process.env.REDIS_URL) {
  const connection = new Redis(process.env.REDIS_URL);
  notificationQueue = new Queue('notifications', { connection });
} else {
  notificationQueue = new QueueMock('notifications');
}

export { notificationQueue };
