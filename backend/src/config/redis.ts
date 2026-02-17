import { createClient } from "redis";

export const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

export const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("Redis connected");
  }
};
