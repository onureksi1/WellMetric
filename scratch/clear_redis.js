const Redis = require('ioredis');

async function clearCache() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'changeme'
  });

  try {
    await redis.del('platform:settings');
    await redis.del('platform:settings:public');
    console.log('Redis cache cleared');
  } catch (err) {
    console.error('Error clearing Redis cache:', err);
  } finally {
    redis.disconnect();
  }
}

clearCache();
