import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { sendOTP, verifyOTP } from "../services/otp.service";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import jwt from "jsonwebtoken";

//CLIENT REGISTRATION
export const registerClient = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ message: "Email already exists" });

  const hashed = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashed,
      role: "CLIENT",
      isVerified: false,
    },
  });

  await sendOTP(`verify:${email}`, email, "Verify Your Email");

  res.json({ message: "OTP sent to email" });
};

//OTP VERIFICATION
export const verifyClientOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  const isValid = await verifyOTP(`verify:${email}`, otp);
  if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  res.json({ message: "Account verified successfully" });
};

//LOGIN WITH PASSWORD (ALL ROLES)
export const loginWithPassword = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return res.status(400).json({ message: "Invalid credentials" });

  if (!user.isVerified)
    return res.status(403).json({ message: "Account not verified" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const accessToken = signAccessToken({ id: user.id, role: user.role });

  const refreshToken = signRefreshToken({
    id: user.id,
    tokenVersion: user.refreshTokenVersion,
  });

  res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  path: "/auth/refresh",
});


  res.json({ accessToken, role: user.role });
};

//REFRESH TOKEN API
export const refreshAccessToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const payload: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET!);

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || user.refreshTokenVersion !== payload.tokenVersion)
      return res.sendStatus(401);

    const accessToken = signAccessToken({ id: user.id, role: user.role });

    res.json({ accessToken });
  } catch {
    res.sendStatus(401);
  }
};


//EMPLOYEE — REQUEST PASSWORD SETUP OTP
export const requestPasswordSetupOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "EMPLOYEE")
    return res.status(400).json({ message: "Invalid request" });

  await sendOTP(`pwdsetup:${email}`, email, "Set Your Password");

  res.json({ message: "OTP sent" });
};

//EMPLOYEE — VERIFY OTP + SET PASSWORD
export const verifyPasswordSetup = async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body;

  const valid = await verifyOTP(`pwdsetup:${email}`, otp);
  if (!valid) return res.status(400).json({ message: "Invalid OTP" });

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { email },
    data: { passwordHash: hashed, isVerified: true },
  });

  res.json({ message: "Password set successfully" });
};

//LOGOUT
export const logout = async (req: any, res: Response) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      refreshTokenVersion: { increment: 1 },
    },
  });

  res.clearCookie("refreshToken", { path: "/api/auth/refresh" });

  res.json({ message: "Logged out successfully" });
};