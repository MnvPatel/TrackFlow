import { redis } from "../config/redis";

export const getCache = async (key: string) => {
  const data = await redis.get(key);
  if (!data) return null;
  return JSON.parse(data);
};

export const setCache = async (key: string, value: any, ttl: number) => {
  await redis.set(key, JSON.stringify(value), {
    EX: ttl,
  });
};

export const deleteCache = async (keys: string[]) => {
  if (keys.length > 0) {
    await redis.del(keys);
  }
};