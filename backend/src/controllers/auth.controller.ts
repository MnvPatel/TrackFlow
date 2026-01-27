import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma";
import { sendOTP, verifyOTP } from "../services/otp.service";
import { signToken } from "../utils/jwt";

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

  const otp = await sendOTP(`verify:${email}`);

  console.log("OTP:", otp); // replace with email service

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

  const token = signToken({ id: user.id, role: user.role });

  res.json({ token, role: user.role });
};

//EMPLOYEE — REQUEST PASSWORD SETUP OTP
export const requestPasswordSetupOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== "EMPLOYEE")
    return res.status(400).json({ message: "Invalid request" });

  const otp = await sendOTP(`pwdsetup:${email}`);
  console.log("OTP:", otp);

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