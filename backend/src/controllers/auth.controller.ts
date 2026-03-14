import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { sendOTP, verifyOTP } from "../services/otp.service";
import { signAccessToken, signRefreshToken, getRefreshSecret } from "../utils/jwt";
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
  try {
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
    });

    res.json({ accessToken, role: String(user.role) });
  } catch (err) {
    console.error("Login error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    res.status(500).json({ message });
  }
};

//REFRESH TOKEN API
export const refreshAccessToken = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const secret = getRefreshSecret();
    if (!secret) return res.status(500).json({ message: "Server: refresh secret not configured" });
    const payload: any = jwt.verify(token, secret);

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

//GET CURRENT USER (PROFILE)
export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, avatarUrl: true },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getMe error:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

//LOGOUT
export const logout = async (req: any, res: Response) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: {
      refreshTokenVersion: { increment: 1 },
    },
  });

  res.clearCookie("refreshToken", {
    path: "/api/auth/refresh",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.json({ message: "Logged out successfully" });
};