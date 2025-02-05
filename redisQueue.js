const { Queue } = require("bullmq");

const redisConnection = { host: "127.0.0.1", port: 6379 };
const conversionQueue = new Queue("conversionQueue", { connection: redisConnection });

module.exports = conversionQueue;
