const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6379,
  password: 'changeme'
});

redis.del('admin:dashboard:overview').then(() => {
  console.log('Cache cleared');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
