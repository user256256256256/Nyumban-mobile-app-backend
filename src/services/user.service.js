// import Redis from 'ioredis';

let redis;

// ===============================
// Redis Connection (Mock Fallback)
// ===============================
if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  console.warn('[REDIS MOCK] Redis URL not found. Using in-memory mock for user activity.');
  const mockStore = new Map();

  redis = {
    async set(key, value, _flag, ttl) {
      mockStore.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
      return 'OK';
    },
    async get(key) {
      const entry = mockStore.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        mockStore.delete(key);
        return null;
      }
      return entry.value;
    }
  };
}

const USER_ACTIVE_TTL_SECONDS = 300;

// ===============================
// User Activity Tracking
// ===============================
export const setUserActive = async (userId) => {
  await redis.set(`user_active:${userId}`, '1', 'EX', USER_ACTIVE_TTL_SECONDS);
};

export const isUserActive = async (userId) => {
  const val = await redis.get(`user_active:${userId}`);
  return val === '1';
};
