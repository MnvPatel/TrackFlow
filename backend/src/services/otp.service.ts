import { redis } from "../config/redis";
import { generateOTP } from "../utils/otp";
import { hashValue, compareHash } from "../utils/hash";

const OTP_TTL = 300; // 5 min

export const sendOTP = async (key: string) => {
  const otp = generateOTP();
  const hash = await hashValue(otp);

  await redis.set(key, hash, "EX", OTP_TTL);

  return otp; // send via email in real app
};

export const verifyOTP = async (key: string, otp: string) => {
  const hash = await redis.get(key);
  if (!hash) return false;

  const isValid = await compareHash(otp, hash);
  if (isValid) await redis.del(key);

  return isValid;
};
