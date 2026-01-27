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
