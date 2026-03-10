import jwt from "jsonwebtoken";

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
export const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;

export const signAccessToken = (payload: object) => {
  const secret = getAccessSecret();
  if (!secret) throw new Error("JWT_ACCESS_SECRET or JWT_SECRET is not set");
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

export const signRefreshToken = (payload: object) => {
  const secret = getRefreshSecret();
  if (!secret) throw new Error("JWT_REFRESH_SECRET or REFRESH_TOKEN_SECRET is not set");
  return jwt.sign(payload, secret, { expiresIn: "7d" });
};
