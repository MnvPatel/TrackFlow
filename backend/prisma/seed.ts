import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {

  const adminEmail = "admin1@company.com";
  const adminPassword = "Admin@123";

  const exists = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (exists) {
    console.log("Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "ADMIN",
      isActive: true,
      isVerified: true
    }
  });

  console.log("Admin created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
