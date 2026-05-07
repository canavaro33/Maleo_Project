import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("MaleoAdmin2026!", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: "admin@maleo.sch.id" },
    update: {},
    create: {
      name: "Super Admin Maleo",
      email: "admin@maleo.sch.id",
      userCode: "admin",
      password: hashedPassword,
      role: "super_admin",
      force_change_password: false
    },
  });

  console.log("Admin account created/verified:", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
