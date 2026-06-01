import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Menambahkan data siswa, guru, dan wali murid...\n");

  // Get active academic year
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true }
  });

  if (!activeYear) {
    console.error("❌ Tidak ada tahun ajaran yang aktif!");
    process.exit(1);
  }

  console.log(`📚 Menggunakan tahun ajaran: ${activeYear.name} ${activeYear.semester}\n`);

  // ==================== 1. BUAT 3 GURU ====================
  console.log("👨‍🏫 Membuat 3 guru...");

  const teachersData = [
    {
      nip: "198505102010121001",
      name: "Ibu Siti Nurhaliza",
      email: "siti.nurhaliza@maleo.sch.id",
      phone: "081234567890",
      subject: "Matematika",
      subjectCode: "MAT",
    },
    {
      nip: "198607152012102002",
      name: "Bapak Ahmad Suryanto",
      email: "ahmad.suryanto@maleo.sch.id",
      phone: "082345678901",
      subject: "Bahasa Indonesia",
      subjectCode: "BIN",
    },
    {
      nip: "198803202014113003",
      name: "Ibu Dewi Lestari",
      email: "dewi.lestari@maleo.sch.id",
      phone: "083456789012",
      subject: "Bahasa Inggris",
      subjectCode: "BING",
    },
  ];

  const teachers = [];

  for (const teacherData of teachersData) {
    const user = await prisma.user.upsert({
      where: { email: teacherData.email },
      update: {},
      create: {
        name: teacherData.name,
        email: teacherData.email,
        password: await bcrypt.hash("Guru123!", 10),
        role: "teacher",
        force_change_password: false,
      }
    });

    const teacher = await prisma.teacher.upsert({
      where: { nip: teacherData.nip },
      update: {},
      create: {
        nip: teacherData.nip,
        name: teacherData.name,
        email: teacherData.email,
        phone: teacherData.phone,
        subject: teacherData.subject,
        status: "active",
      }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { teacherId: teacher.id }
    });

    teachers.push(teacher);
    console.log(`  ✅ Guru: ${teacher.name} (${teacher.subject})`);
  }

  // ==================== 2. BUAT 3 KELAS ====================
  console.log("\n🏫 Membuat 3 kelas...");

  const classesData = [
    {
      name: "VII-A",
      level: 7,
      teacher: teachers[0], // Ibu Siti (Matematika)
    },
    {
      name: "VII-B",
      level: 7,
      teacher: teachers[1], // Bapak Ahmad (Bahasa Indonesia)
    },
    {
      name: "VII-C",
      level: 7,
      teacher: teachers[2], // Ibu Dewi (Bahasa Inggris)
    },
  ];

  const classes = [];

  for (const classData of classesData) {
    const newClass = await prisma.class.upsert({
      where: { name: classData.name },
      update: {
        homeroomTeacherId: classData.teacher.id
      },
      create: {
        name: classData.name,
        level: classData.level,
        homeroomTeacherId: classData.teacher.id,
      }
    });

    classes.push(newClass);
    console.log(`  ✅ Kelas: ${newClass.name} - Wali Kelas: ${classData.teacher.name}`);
  }

  // ==================== 3. BUAT 3 SISWA ====================
  console.log("\n📚 Membuat 3 siswa...");

  interface StudentData {
    nis: string;
    name: string;
    gender: "L" | "P";
    birthDate: Date;
    address: string;
    phone: string;
    class: typeof classes[0];
  }

  const studentsData: StudentData[] = [
    {
      nis: "2026001001",
      name: "Ahmad Ridho Pratama",
      gender: "L",
      birthDate: new Date("2012-03-15"),
      address: "Jalan Merdeka No. 10",
      phone: "081234567900",
      class: classes[0], // Kelas VII-A (Guru: Ibu Siti)
    },
    {
      nis: "2026001002",
      name: "Siti Nur Anisa",
      gender: "P",
      birthDate: new Date("2012-05-20"),
      address: "Jalan Ahmad Yani No. 25",
      phone: "082345678900",
      class: classes[1], // Kelas VII-B (Guru: Bapak Ahmad)
    },
    {
      nis: "2026001003",
      name: "Muhammad Fajar Rizki",
      gender: "L",
      birthDate: new Date("2012-07-10"),
      address: "Jalan Diponegoro No. 15",
      phone: "083456789000",
      class: classes[2], // Kelas VII-C (Guru: Ibu Dewi)
    },
  ];

  const students = [];

  for (const studentData of studentsData) {
    const studentUser = await prisma.user.upsert({
      where: { nipNis: studentData.nis },
      update: {},
      create: {
        name: studentData.name,
        nipNis: studentData.nis,
        password: await bcrypt.hash("Siswa123!", 10),
        role: "student",
        force_change_password: false,
      }
    });

    const student = await prisma.student.upsert({
      where: { nis: studentData.nis },
      update: {
        classId: studentData.class.id
      },
      create: {
        nis: studentData.nis,
        name: studentData.name,
        gender: studentData.gender,
        birthDate: studentData.birthDate,
        address: studentData.address,
        phone: studentData.phone,
        status: "active",
        classId: studentData.class.id,
      }
    });

    await prisma.user.update({
      where: { id: studentUser.id },
      data: { studentId: student.id }
    });

    students.push(student);
    console.log(`  ✅ Siswa: ${student.name} - Kelas: ${studentData.class.name}`);
  }

  // ==================== 4. BUAT 3 WALI MURID ====================
  console.log("\n👨‍👩‍👧 Membuat 3 wali murid...");

  const guardiansData = [
    {
      name: "Bapak Supratman",
      phone: "081111111111",
      email: "supratman@email.com",
      address: "Jalan Merdeka No. 10",
      occupation: "PNS",
      students: [students[0]], // Wali dari Ahmad Ridho
    },
    {
      name: "Ibu Nurlaela",
      phone: "082222222222",
      email: "nurlaela@email.com",
      address: "Jalan Ahmad Yani No. 25",
      occupation: "Guru",
      students: [students[1]], // Wali dari Siti Nur Anisa
    },
    {
      name: "Bapak Hendra Kusuma",
      phone: "083333333333",
      email: "hendra.kusuma@email.com",
      address: "Jalan Diponegoro No. 15",
      occupation: "Wiraswasta",
      students: [students[2]], // Wali dari Muhammad Fajar
    },
  ];

  for (const guardianData of guardiansData) {
    const guardianUser = await prisma.user.upsert({
      where: { email: guardianData.email },
      update: {},
      create: {
        name: guardianData.name,
        email: guardianData.email,
        password: await bcrypt.hash("Wali123!", 10),
        role: "guardian",
        force_change_password: false,
      }
    });

    const guardian = await prisma.guardian.upsert({
      where: { email: guardianData.email },
      update: {},
      create: {
        name: guardianData.name,
        phone: guardianData.phone,
        email: guardianData.email,
        address: guardianData.address,
        occupation: guardianData.occupation,
      }
    });

    // Link guardian ke students
    for (const student of guardianData.students) {
      await prisma.guardian.update({
        where: { id: guardian.id },
        data: {
          students: {
            connect: { id: student.id }
          }
        }
      });
    }

    await prisma.user.update({
      where: { id: guardianUser.id },
      data: { guardianId: guardian.id }
    });

    console.log(`  ✅ Wali: ${guardian.name} - Siswa: ${guardianData.students.map(s => s.name).join(", ")}`);
  }

  // ==================== 5. BUAT SUBJECTS & LINK KE TEACHERS ====================
  console.log("\n📖 Mengupdate mata pelajaran guru...");

  for (const teacher of teachers) {
    const subject = await prisma.subject.findFirst({
      where: {
        teacher: { id: teacher.id }
      }
    });

    if (subject) {
      console.log(`  ✅ Mata pelajaran untuk ${teacher.name}: ${subject.name}`);
    }
  }

  console.log("\n✨ Data berhasil ditambahkan!");
  console.log("\n📝 Ringkasan Data yang Ditambahkan:");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\n📚 SISWA:");
  for (const student of students) {
    const studentClass = classes.find(c => c.id === student.classId);
    const classTeacher = teachers.find(t => t.id === studentClass?.homeroomTeacherId);
    console.log(`  • ${student.name} (NIS: ${student.nis}) - Kelas ${studentClass?.name} - Wali: ${classTeacher?.name}`);
  }

  console.log("\n👨‍🏫 GURU:");
  for (const teacher of teachers) {
    const teacherClass = classes.find(c => c.homeroomTeacherId === teacher.id);
    console.log(`  • ${teacher.name} (NIP: ${teacher.nip}) - ${teacher.subject} - Wali Kelas ${teacherClass?.name}`);
  }

  console.log("\n👨‍👩‍👧 WALI MURID:");
  for (const guardianData of guardiansData) {
    const studentNames = guardianData.students.map(s => s.name).join(", ");
    console.log(`  • ${guardianData.name} - Wali dari: ${studentNames}`);
  }

  console.log("\n🔐 AKSES LOGIN:");
  console.log("  SISWA: NIS + password 'Siswa123!'");
  console.log("  GURU: Email + password 'Guru123!'");
  console.log("  WALI MURID: Email + password 'Wali123!'");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
