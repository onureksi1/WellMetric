const Redis = require('ioredis');

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'changeme'
});

async function clear() {
  try {
    await redis.flushall();
    console.log('Redis cache cleared successfully!');
  } catch (err) {
    console.error('Failed to clear Redis cache:', err);
  } finally {
    process.exit(0);
  }
}

clear();
