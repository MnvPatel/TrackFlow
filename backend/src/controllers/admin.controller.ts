import { Request, Response } from "express";
import prisma from "../prisma";

//ADMIN - CREATE EMPLOYEE
export const createEmployee = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ message: "User exists" });

  await prisma.user.create({
    data: {
      name,
      email,
      role: "EMPLOYEE",
      isVerified: false,
    },
  });

  res.json({ message: "Employee created. OTP required to set password." });
};