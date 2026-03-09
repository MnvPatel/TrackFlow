import jwt from "jsonwebtoken";

const getAccessSecret = () =>
  process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
export const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.REFRESH_TOKEN_SECRET;

export const signAccessToken = (payload: object) =>
  jwt.sign(payload, getAccessSecret()!, { expiresIn: "15m" });

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, getRefreshSecret()!, { expiresIn: "7d" });
