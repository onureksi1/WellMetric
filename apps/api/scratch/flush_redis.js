const Redis = require('ioredis');

async function flush() {
  const redis = new Redis({
    host: 'localhost',
    port: 6379,
    password: 'changeme'
  });
  
  try {
    const res = await redis.flushall();
    console.log('Redis cleared:', res);
  } catch (err) {
    console.error('Redis flush error:', err);
  } finally {
    process.exit();
  }
}

flush();
