import { Request, Response } from "express";
import prisma from "../prisma";
import { Role } from "@prisma/client";
import { sendMail } from "../services/mail.service";
import { accountCreatedTemplate } from "../templates/accountCreatedMail";

//ADMIN - LIST USERS (for dropdowns: ?role=CLIENT | EMPLOYEE)
export const getUsers = async (req: Request, res: Response) => {
  const role = req.query.role as Role | undefined;
  const where = role ? { role, isActive: true } : { isActive: true };
  const users = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, role: true },
  });
  res.json(users);
};

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

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const setPasswordLink = `${frontendUrl}/set-password?email=${encodeURIComponent(email)}`;
  await sendMail(
    email,
    "Your account has been created – set your password",
    accountCreatedTemplate(name, setPasswordLink)
  );

  res.json({ message: "Employee created. OTP required to set password." });
};