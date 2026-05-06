const Redis = require('ioredis');

async function flush() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'changeme',
  });

  try {
    const result = await redis.flushall();
    console.log('Redis flushed:', result);
    
    // Also clear specific keys just in case
    await redis.del('admin:dashboard:overview');
    console.log('Specific key deleted');
  } catch (err) {
    console.error('Error flushing redis:', err);
  } finally {
    process.exit();
  }
}

flush();
