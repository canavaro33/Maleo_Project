import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // 1. Users
  const adminPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@maleo.sch.id" },
    update: {},
    create: { name: "Admin Utama", email: "admin@maleo.sch.id", password: adminPassword, role: "super_admin" },
  });
  console.log("✅ Users seeded");

  // 2. Teachers
  const teachersData = [
    { nip: "198501012010011001", name: "Dr. Surya Darma, M.Pd", gender: "L" as const, email: "surya@maleo.sch.id", phone: "081345678901", subject: "Matematika" },
    { nip: "198702152011012002", name: "Hj. Rahmawati, S.Pd", gender: "P" as const, email: "rahma@maleo.sch.id", phone: "081345678902", subject: "Bahasa Indonesia" },
    { nip: "199003202012011003", name: "Andi Wijaya, S.Si", gender: "L" as const, email: "andi@maleo.sch.id", phone: "081345678903", subject: "IPA" },
    { nip: "198805102013012004", name: "Sari Indah, S.Pd", gender: "P" as const, email: "sari@maleo.sch.id", phone: "081345678904", subject: "Bahasa Inggris" },
    { nip: "199201252014011005", name: "Fajar Nugroho, S.Pd", gender: "L" as const, email: "fajar@maleo.sch.id", phone: "081345678905", subject: "IPS" },
    { nip: "199105152015012006", name: "Lina Marlina, S.Ag", gender: "P" as const, email: "lina@maleo.sch.id", phone: "081345678906", subject: "Pendidikan Agama" },
    { nip: "198908202016011007", name: "Bambang Suryanto, S.Pd", gender: "L" as const, email: "bambang@maleo.sch.id", phone: "081345678907", subject: "PJOK", status: "inactive" as const },
    { nip: "199304102017012008", name: "Mega Puspita, S.Kom", gender: "P" as const, email: "mega@maleo.sch.id", phone: "081345678908", subject: "Informatika" },
  ];

  const teachers = [];
  for (const t of teachersData) {
    const teacher = await prisma.teacher.upsert({
      where: { nip: t.nip },
      update: {},
      create: t,
    });
    teachers.push(teacher);
  }
  console.log("✅ Teachers seeded");

  // 3. Guardians
  const guardiansData = [
    { name: "Budi Santoso", phone: "081456789001", email: "budi@email.com", address: "Jl. Merpati No. 12", occupation: "Wiraswasta" },
    { name: "Hasan Basri", phone: "081456789002", email: "hasan@email.com", address: "Jl. Kenanga No. 5", occupation: "PNS" },
    { name: "Rahmat Hidayat", phone: "081456789003", email: "rahmat@email.com", address: "Jl. Dahlia No. 8", occupation: "Guru" },
    { name: "Agus Purnomo", phone: "081456789004", email: "agus@email.com", address: "Jl. Anggrek No. 17", occupation: "Dokter" },
    { name: "Suparman", phone: "081456789005", email: "suparman@email.com", address: "Jl. Flamboyan No. 6", occupation: "Pedagang" },
  ];

  const guardians = [];
  for (const g of guardiansData) {
    const guardian = await prisma.guardian.upsert({
      where: { id: guardians.length + 1 },
      update: {},
      create: g,
    });
    guardians.push(guardian);
  }
  console.log("✅ Guardians seeded");

  // 4. Grades
  const gradesData = [
    { name: "VII-A", level: 7, group: "A", homeroomTeacherId: teachers[0].id },
    { name: "VII-B", level: 7, group: "B", homeroomTeacherId: teachers[1].id },
    { name: "VIII-A", level: 8, group: "A", homeroomTeacherId: teachers[2].id },
    { name: "VIII-B", level: 8, group: "B", homeroomTeacherId: teachers[3].id },
    { name: "IX-A", level: 9, group: "A", homeroomTeacherId: teachers[4].id },
    { name: "IX-B", level: 9, group: "B", homeroomTeacherId: teachers[5].id },
  ];

  const grades = [];
  for (const g of gradesData) {
    const grade = await prisma.grade.upsert({
      where: { name: g.name },
      update: {},
      create: g,
    });
    grades.push(grade);
  }
  console.log("✅ Grades seeded");

  // 5. Students
  const studentsData = [
    { nis: "2024001", name: "Ahmad Fadillah", gender: "L" as const, birthDate: new Date("2012-03-15"), address: "Jl. Merpati No. 12", phone: "081234567890", gradeId: grades[0].id, guardianId: guardians[0].id },
    { nis: "2024002", name: "Siti Nurhaliza", gender: "P" as const, birthDate: new Date("2012-07-22"), address: "Jl. Kenanga No. 5", phone: "081234567891", gradeId: grades[0].id, guardianId: guardians[1].id },
    { nis: "2024003", name: "Muhammad Rizki", gender: "L" as const, birthDate: new Date("2012-01-10"), address: "Jl. Dahlia No. 8", phone: "081234567892", gradeId: grades[1].id, guardianId: guardians[2].id },
    { nis: "2024004", name: "Aisyah Putri", gender: "P" as const, birthDate: new Date("2012-11-05"), address: "Jl. Mawar No. 3", phone: "081234567893", gradeId: grades[1].id },
    { nis: "2024005", name: "Dimas Prasetyo", gender: "L" as const, birthDate: new Date("2011-06-18"), address: "Jl. Anggrek No. 17", phone: "081234567894", gradeId: grades[2].id, guardianId: guardians[3].id },
    { nis: "2024006", name: "Fatimah Zahra", gender: "P" as const, birthDate: new Date("2011-09-25"), address: "Jl. Melati No. 9", phone: "081234567895", gradeId: grades[2].id },
    { nis: "2024007", name: "Reza Firmansyah", gender: "L" as const, birthDate: new Date("2011-04-12"), address: "Jl. Cempaka No. 21", phone: "081234567896", gradeId: grades[3].id, status: "inactive" as const },
    { nis: "2024008", name: "Nurul Aini", gender: "P" as const, birthDate: new Date("2010-12-30"), address: "Jl. Flamboyan No. 6", phone: "081234567897", gradeId: grades[4].id, guardianId: guardians[4].id },
    { nis: "2024009", name: "Bayu Setiawan", gender: "L" as const, birthDate: new Date("2010-08-14"), address: "Jl. Bougenville No. 11", phone: "081234567898", gradeId: grades[4].id },
    { nis: "2024010", name: "Dewi Lestari", gender: "P" as const, birthDate: new Date("2010-02-20"), address: "Jl. Teratai No. 4", phone: "081234567899", gradeId: grades[5].id },
    { nis: "2024011", name: "Ilham Maulana", gender: "L" as const, birthDate: new Date("2012-05-08"), address: "Jl. Sakura No. 14", phone: "081234567810", gradeId: grades[0].id },
    { nis: "2024012", name: "Rahma Wati", gender: "P" as const, birthDate: new Date("2012-10-03"), address: "Jl. Tulip No. 7", phone: "081234567811", gradeId: grades[1].id },
  ];

  const students = [];
  for (const s of studentsData) {
    const student = await prisma.student.upsert({
      where: { nis: s.nis },
      update: {},
      create: s,
    });
    students.push(student);
  }
  console.log("✅ Students seeded");

  // 6. Academic Years
  await prisma.academicYear.createMany({
    data: [
      { name: "2024/2025", semester: "Ganjil", startDate: new Date("2024-07-15"), endDate: new Date("2024-12-20") },
      { name: "2024/2025", semester: "Genap", startDate: new Date("2025-01-06"), endDate: new Date("2025-06-20") },
      { name: "2025/2026", semester: "Ganjil", startDate: new Date("2025-07-14"), endDate: new Date("2025-12-19"), isActive: true },
      { name: "2025/2026", semester: "Genap", startDate: new Date("2026-01-05"), endDate: new Date("2026-06-19") },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Academic Years seeded");

  // 7. Subjects
  const subjectsData = [
    { code: "MTK", name: "Matematika", gradeLevel: 7, hoursPerWeek: 5, teacherId: teachers[0].id },
    { code: "BIN", name: "Bahasa Indonesia", gradeLevel: 7, hoursPerWeek: 5, teacherId: teachers[1].id },
    { code: "IPA", name: "Ilmu Pengetahuan Alam", gradeLevel: 7, hoursPerWeek: 5, teacherId: teachers[2].id },
    { code: "BIG", name: "Bahasa Inggris", gradeLevel: 7, hoursPerWeek: 4, teacherId: teachers[3].id },
    { code: "IPS", name: "Ilmu Pengetahuan Sosial", gradeLevel: 7, hoursPerWeek: 4, teacherId: teachers[4].id },
    { code: "PAI", name: "Pendidikan Agama Islam", gradeLevel: 7, hoursPerWeek: 3, teacherId: teachers[5].id },
    { code: "PJK", name: "Pendidikan Jasmani", gradeLevel: 7, hoursPerWeek: 3, teacherId: teachers[6].id },
    { code: "INF", name: "Informatika", gradeLevel: 7, hoursPerWeek: 2, teacherId: teachers[7].id },
  ];

  const subjects = [];
  for (const s of subjectsData) {
    const subject = await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
    subjects.push(subject);
  }
  console.log("✅ Subjects seeded");

  // 8. Schedules
  await prisma.schedule.createMany({
    data: [
      { day: "Senin", startTime: "07:00", endTime: "08:30", subjectId: subjects[0].id, teacherId: teachers[0].id, gradeId: grades[0].id, room: "R.101" },
      { day: "Senin", startTime: "08:30", endTime: "10:00", subjectId: subjects[1].id, teacherId: teachers[1].id, gradeId: grades[0].id, room: "R.101" },
      { day: "Senin", startTime: "10:15", endTime: "11:45", subjectId: subjects[2].id, teacherId: teachers[2].id, gradeId: grades[0].id, room: "R.Lab" },
      { day: "Selasa", startTime: "07:00", endTime: "08:30", subjectId: subjects[3].id, teacherId: teachers[3].id, gradeId: grades[0].id, room: "R.101" },
      { day: "Selasa", startTime: "08:30", endTime: "10:00", subjectId: subjects[4].id, teacherId: teachers[4].id, gradeId: grades[0].id, room: "R.101" },
      { day: "Selasa", startTime: "10:15", endTime: "11:45", subjectId: subjects[5].id, teacherId: teachers[5].id, gradeId: grades[0].id, room: "R.Agama" },
      { day: "Rabu", startTime: "07:00", endTime: "08:30", subjectId: subjects[0].id, teacherId: teachers[0].id, gradeId: grades[1].id, room: "R.102" },
      { day: "Rabu", startTime: "08:30", endTime: "10:00", subjectId: subjects[7].id, teacherId: teachers[7].id, gradeId: grades[0].id, room: "R.Komputer" },
      { day: "Kamis", startTime: "07:00", endTime: "08:30", subjectId: subjects[6].id, teacherId: teachers[6].id, gradeId: grades[0].id, room: "Lapangan" },
      { day: "Kamis", startTime: "08:30", endTime: "10:00", subjectId: subjects[1].id, teacherId: teachers[1].id, gradeId: grades[1].id, room: "R.102" },
      { day: "Jumat", startTime: "07:00", endTime: "08:30", subjectId: subjects[2].id, teacherId: teachers[2].id, gradeId: grades[1].id, room: "R.Lab" },
      { day: "Jumat", startTime: "08:30", endTime: "10:00", subjectId: subjects[3].id, teacherId: teachers[3].id, gradeId: grades[1].id, room: "R.102" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Schedules seeded");

  // 9. Attendances
  const attDate = new Date("2025-10-20");
  const attStatuses: Array<{ status: "hadir" | "izin" | "sakit" | "alpa"; note?: string }> = [
    { status: "hadir" }, { status: "hadir" }, { status: "sakit", note: "Demam" }, { status: "hadir" },
    { status: "izin", note: "Acara keluarga" }, { status: "hadir" }, { status: "alpa" }, { status: "hadir" },
    { status: "hadir" }, { status: "hadir" }, { status: "sakit", note: "Flu" }, { status: "hadir" },
  ];

  await prisma.attendance.createMany({
    data: students.map((s, i) => ({
      date: attDate,
      status: attStatuses[i].status,
      note: attStatuses[i].note || null,
      studentId: s.id,
    })),
    skipDuplicates: true,
  });
  console.log("✅ Attendances seeded");

  // 10. Scores
  await prisma.score.createMany({
    data: [
      { studentId: students[0].id, subjectId: subjects[0].id, type: "Tugas", score: 85, maxScore: 100, date: new Date("2025-10-15") },
      { studentId: students[0].id, subjectId: subjects[0].id, type: "UTS", score: 78, maxScore: 100, date: new Date("2025-10-10") },
      { studentId: students[1].id, subjectId: subjects[0].id, type: "Tugas", score: 92, maxScore: 100, date: new Date("2025-10-15") },
      { studentId: students[1].id, subjectId: subjects[1].id, type: "UTS", score: 88, maxScore: 100, date: new Date("2025-10-10") },
      { studentId: students[2].id, subjectId: subjects[2].id, type: "Kuis", score: 75, maxScore: 100, date: new Date("2025-10-12") },
      { studentId: students[3].id, subjectId: subjects[3].id, type: "Tugas", score: 90, maxScore: 100, date: new Date("2025-10-15") },
      { studentId: students[4].id, subjectId: subjects[0].id, type: "UAS", score: 82, maxScore: 100, date: new Date("2025-10-18") },
      { studentId: students[5].id, subjectId: subjects[4].id, type: "Tugas", score: 95, maxScore: 100, date: new Date("2025-10-15") },
      { studentId: students[7].id, subjectId: subjects[1].id, type: "UTS", score: 87, maxScore: 100, date: new Date("2025-10-10") },
      { studentId: students[8].id, subjectId: subjects[2].id, type: "Kuis", score: 70, maxScore: 100, date: new Date("2025-10-12") },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Scores seeded");

  // 11. Announcements
  await prisma.announcement.createMany({
    data: [
      { title: "Jadwal UTS Semester Ganjil 2025/2026", content: "Ujian Tengah Semester Ganjil akan dilaksanakan pada tanggal 3-10 November 2025.", author: "Admin", target: "all", priority: "important", isPublished: true },
      { title: "Rapat Wali Murid Kelas VII", content: "Rapat wali murid kelas VII akan diadakan pada hari Sabtu, 25 Oktober 2025 pukul 09:00 WIB di Aula Sekolah.", author: "Admin", target: "guardian", priority: "normal", isPublished: true },
      { title: "Pelatihan Google Classroom untuk Guru", content: "Pelatihan penggunaan Google Classroom akan diadakan pada hari Kamis, 23 Oktober 2025. Seluruh guru wajib hadir.", author: "Admin", target: "teacher", priority: "important", isPublished: true },
      { title: "Libur Hari Pahlawan", content: "Sekolah libur pada tanggal 10 November 2025 dalam rangka memperingati Hari Pahlawan.", author: "Admin", target: "all", priority: "normal", isPublished: true },
      { title: "Perlombaan HUT RI (Draft)", content: "Rangkaian kegiatan perlombaan dalam rangka HUT RI ke-80.", author: "Admin", target: "student", priority: "normal", isPublished: false },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Announcements seeded");

  console.log("\n🎉 Semua data berhasil di-seed!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
