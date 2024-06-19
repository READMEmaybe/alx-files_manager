const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.connected = true;
    this.client.on('connect', () => {
      this.client.connected = true;
    });
    this.client.on('error', (err) => {
      console.log(`Redis client not connected to the server: ${err.message}`);
      this.client.connected = false;
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    return promisify(this.client.get).bind(this.client)(key);
  }

  async set(key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
