import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai pembersihan dan inisialisasi database (Clean State)...\n");

  // 1. Inisialisasi Akun Super Admin
  const adminEmail = "admin@maleo.sch.id";
  const adminPassword = await bcrypt.hash("MaleoAdmin2026!", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: adminPassword,
    },
    create: {
      name: "Admin Utama",
      email: adminEmail,
      password: adminPassword,
      role: "super_admin",
      force_change_password: false,
    },
  });

  console.log(`✅ Super Admin siap: ${admin.email}`);

  // 2. Inisialisasi Tahun Ajaran Aktif
  const yearName = "2025/2026";
  const semester = "Ganjil";

  let activeYear = await prisma.academicYear.findFirst({
    where: { name: yearName, semester: "Ganjil" }
  });

  if (!activeYear) {
    activeYear = await prisma.academicYear.create({
      data: {
        name: yearName,
        semester: "Ganjil",
        startDate: new Date("2025-07-14"),
        endDate: new Date("2025-12-19"),
        isActive: true,
      },
    });
  } else {
    activeYear = await prisma.academicYear.update({
      where: { id: activeYear.id },
      data: { isActive: true }
    });
  }

  console.log(`✅ Tahun Ajaran Aktif siap: ${activeYear.name} ${activeYear.semester}`);

  console.log("\n🎉 Database berhasil dibersihkan! Anda sekarang bisa mulai menginput data asli dari frontend.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
