import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const USER_ACTIVE_TTL_SECONDS = 300;

export const setUserActive = async (userId) => {
  await redis.set(`user_active:${userId}`, '1', 'EX', USER_ACTIVE_TTL_SECONDS);
};

export const isUserActive = async (userId) => {
  const val = await redis.get(`user_active:${userId}`);
  return val === '1';
};
