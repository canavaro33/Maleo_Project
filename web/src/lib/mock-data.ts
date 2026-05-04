import type {
  Student,
  Teacher,
  Guardian,
  AcademicYear,
  Grade,
  Subject,
  Schedule,
  Attendance,
  Score,
  Announcement,
} from "@/types";

export const students: Student[] = [
  { id: 1, nis: "2024001", name: "Ahmad Fadillah", gender: "L", birthDate: "2012-03-15", address: "Jl. Merpati No. 12", phone: "081234567890", gradeId: 1, gradeName: "VII-A", status: "active", guardianId: 1, guardianName: "Budi Santoso" },
  { id: 2, nis: "2024002", name: "Siti Nurhaliza", gender: "P", birthDate: "2012-07-22", address: "Jl. Kenanga No. 5", phone: "081234567891", gradeId: 1, gradeName: "VII-A", status: "active", guardianId: 2, guardianName: "Hasan Basri" },
  { id: 3, nis: "2024003", name: "Muhammad Rizki", gender: "L", birthDate: "2012-01-10", address: "Jl. Dahlia No. 8", phone: "081234567892", gradeId: 2, gradeName: "VII-B", status: "active", guardianId: 3, guardianName: "Rahmat Hidayat" },
  { id: 4, nis: "2024004", name: "Aisyah Putri", gender: "P", birthDate: "2012-11-05", address: "Jl. Mawar No. 3", phone: "081234567893", gradeId: 2, gradeName: "VII-B", status: "active" },
  { id: 5, nis: "2024005", name: "Dimas Prasetyo", gender: "L", birthDate: "2011-06-18", address: "Jl. Anggrek No. 17", phone: "081234567894", gradeId: 3, gradeName: "VIII-A", status: "active", guardianId: 4, guardianName: "Agus Purnomo" },
  { id: 6, nis: "2024006", name: "Fatimah Zahra", gender: "P", birthDate: "2011-09-25", address: "Jl. Melati No. 9", phone: "081234567895", gradeId: 3, gradeName: "VIII-A", status: "active" },
  { id: 7, nis: "2024007", name: "Reza Firmansyah", gender: "L", birthDate: "2011-04-12", address: "Jl. Cempaka No. 21", phone: "081234567896", gradeId: 4, gradeName: "VIII-B", status: "inactive" },
  { id: 8, nis: "2024008", name: "Nurul Aini", gender: "P", birthDate: "2010-12-30", address: "Jl. Flamboyan No. 6", phone: "081234567897", gradeId: 5, gradeName: "IX-A", status: "active", guardianId: 5, guardianName: "Suparman" },
  { id: 9, nis: "2024009", name: "Bayu Setiawan", gender: "L", birthDate: "2010-08-14", address: "Jl. Bougenville No. 11", phone: "081234567898", gradeId: 5, gradeName: "IX-A", status: "active" },
  { id: 10, nis: "2024010", name: "Dewi Lestari", gender: "P", birthDate: "2010-02-20", address: "Jl. Teratai No. 4", phone: "081234567899", gradeId: 6, gradeName: "IX-B", status: "active" },
  { id: 11, nis: "2024011", name: "Ilham Maulana", gender: "L", birthDate: "2012-05-08", address: "Jl. Sakura No. 14", phone: "081234567810", gradeId: 1, gradeName: "VII-A", status: "active" },
  { id: 12, nis: "2024012", name: "Rahma Wati", gender: "P", birthDate: "2012-10-03", address: "Jl. Tulip No. 7", phone: "081234567811", gradeId: 2, gradeName: "VII-B", status: "active" },
];

export const teachers: Teacher[] = [
  { id: 1, nip: "198501012010011001", name: "Dr. Surya Darma, M.Pd", gender: "L", email: "surya@maleo.sch.id", phone: "081345678901", subject: "Matematika", status: "active" },
  { id: 2, nip: "198702152011012002", name: "Hj. Rahmawati, S.Pd", gender: "P", email: "rahma@maleo.sch.id", phone: "081345678902", subject: "Bahasa Indonesia", status: "active" },
  { id: 3, nip: "199003202012011003", name: "Andi Wijaya, S.Si", gender: "L", email: "andi@maleo.sch.id", phone: "081345678903", subject: "IPA", status: "active" },
  { id: 4, nip: "198805102013012004", name: "Sari Indah, S.Pd", gender: "P", email: "sari@maleo.sch.id", phone: "081345678904", subject: "Bahasa Inggris", status: "active" },
  { id: 5, nip: "199201252014011005", name: "Fajar Nugroho, S.Pd", gender: "L", email: "fajar@maleo.sch.id", phone: "081345678905", subject: "IPS", status: "active" },
  { id: 6, nip: "199105152015012006", name: "Lina Marlina, S.Ag", gender: "P", email: "lina@maleo.sch.id", phone: "081345678906", subject: "Pendidikan Agama", status: "active" },
  { id: 7, nip: "198908202016011007", name: "Bambang Suryanto, S.Pd", gender: "L", email: "bambang@maleo.sch.id", phone: "081345678907", subject: "PJOK", status: "inactive" },
  { id: 8, nip: "199304102017012008", name: "Mega Puspita, S.Kom", gender: "P", email: "mega@maleo.sch.id", phone: "081345678908", subject: "Informatika", status: "active" },
];

export const guardians: Guardian[] = [
  { id: 1, name: "Budi Santoso", phone: "081456789001", email: "budi@email.com", address: "Jl. Merpati No. 12", occupation: "Wiraswasta", children: [{ id: 1, name: "Ahmad Fadillah", grade: "VII-A" }] },
  { id: 2, name: "Hasan Basri", phone: "081456789002", email: "hasan@email.com", address: "Jl. Kenanga No. 5", occupation: "PNS", children: [{ id: 2, name: "Siti Nurhaliza", grade: "VII-A" }] },
  { id: 3, name: "Rahmat Hidayat", phone: "081456789003", email: "rahmat@email.com", address: "Jl. Dahlia No. 8", occupation: "Guru", children: [{ id: 3, name: "Muhammad Rizki", grade: "VII-B" }] },
  { id: 4, name: "Agus Purnomo", phone: "081456789004", email: "agus@email.com", address: "Jl. Anggrek No. 17", occupation: "Dokter", children: [{ id: 5, name: "Dimas Prasetyo", grade: "VIII-A" }] },
  { id: 5, name: "Suparman", phone: "081456789005", email: "suparman@email.com", address: "Jl. Flamboyan No. 6", occupation: "Pedagang", children: [{ id: 8, name: "Nurul Aini", grade: "IX-A" }] },
];

export const academicYears: AcademicYear[] = [
  { id: 1, name: "2024/2025", semester: "Ganjil", startDate: "2024-07-15", endDate: "2024-12-20", isActive: false },
  { id: 2, name: "2024/2025", semester: "Genap", startDate: "2025-01-06", endDate: "2025-06-20", isActive: false },
  { id: 3, name: "2025/2026", semester: "Ganjil", startDate: "2025-07-14", endDate: "2025-12-19", isActive: true },
  { id: 4, name: "2025/2026", semester: "Genap", startDate: "2026-01-05", endDate: "2026-06-19", isActive: false },
];

export const grades: Grade[] = [
  { id: 1, name: "VII-A", level: 7, group: "A", homeroomTeacher: "Dr. Surya Darma, M.Pd", homeroomTeacherId: 1, studentCount: 32 },
  { id: 2, name: "VII-B", level: 7, group: "B", homeroomTeacher: "Hj. Rahmawati, S.Pd", homeroomTeacherId: 2, studentCount: 30 },
  { id: 3, name: "VIII-A", level: 8, group: "A", homeroomTeacher: "Andi Wijaya, S.Si", homeroomTeacherId: 3, studentCount: 31 },
  { id: 4, name: "VIII-B", level: 8, group: "B", homeroomTeacher: "Sari Indah, S.Pd", homeroomTeacherId: 4, studentCount: 29 },
  { id: 5, name: "IX-A", level: 9, group: "A", homeroomTeacher: "Fajar Nugroho, S.Pd", homeroomTeacherId: 5, studentCount: 33 },
  { id: 6, name: "IX-B", level: 9, group: "B", homeroomTeacher: "Lina Marlina, S.Ag", homeroomTeacherId: 6, studentCount: 28 },
];

export const subjects: Subject[] = [
  { id: 1, code: "MTK", name: "Matematika", teacherId: 1, teacherName: "Dr. Surya Darma, M.Pd", gradeLevel: 7, hoursPerWeek: 5 },
  { id: 2, code: "BIN", name: "Bahasa Indonesia", teacherId: 2, teacherName: "Hj. Rahmawati, S.Pd", gradeLevel: 7, hoursPerWeek: 5 },
  { id: 3, code: "IPA", name: "Ilmu Pengetahuan Alam", teacherId: 3, teacherName: "Andi Wijaya, S.Si", gradeLevel: 7, hoursPerWeek: 5 },
  { id: 4, code: "BIG", name: "Bahasa Inggris", teacherId: 4, teacherName: "Sari Indah, S.Pd", gradeLevel: 7, hoursPerWeek: 4 },
  { id: 5, code: "IPS", name: "Ilmu Pengetahuan Sosial", teacherId: 5, teacherName: "Fajar Nugroho, S.Pd", gradeLevel: 7, hoursPerWeek: 4 },
  { id: 6, code: "PAI", name: "Pendidikan Agama Islam", teacherId: 6, teacherName: "Lina Marlina, S.Ag", gradeLevel: 7, hoursPerWeek: 3 },
  { id: 7, code: "PJK", name: "Pendidikan Jasmani", teacherId: 7, teacherName: "Bambang Suryanto, S.Pd", gradeLevel: 7, hoursPerWeek: 3 },
  { id: 8, code: "INF", name: "Informatika", teacherId: 8, teacherName: "Mega Puspita, S.Kom", gradeLevel: 7, hoursPerWeek: 2 },
];

export const schedules: Schedule[] = [
  { id: 1, day: "Senin", startTime: "07:00", endTime: "08:30", subjectName: "Matematika", teacherName: "Dr. Surya Darma, M.Pd", gradeName: "VII-A", room: "R.101" },
  { id: 2, day: "Senin", startTime: "08:30", endTime: "10:00", subjectName: "Bahasa Indonesia", teacherName: "Hj. Rahmawati, S.Pd", gradeName: "VII-A", room: "R.101" },
  { id: 3, day: "Senin", startTime: "10:15", endTime: "11:45", subjectName: "IPA", teacherName: "Andi Wijaya, S.Si", gradeName: "VII-A", room: "R.Lab" },
  { id: 4, day: "Selasa", startTime: "07:00", endTime: "08:30", subjectName: "Bahasa Inggris", teacherName: "Sari Indah, S.Pd", gradeName: "VII-A", room: "R.101" },
  { id: 5, day: "Selasa", startTime: "08:30", endTime: "10:00", subjectName: "IPS", teacherName: "Fajar Nugroho, S.Pd", gradeName: "VII-A", room: "R.101" },
  { id: 6, day: "Selasa", startTime: "10:15", endTime: "11:45", subjectName: "Pendidikan Agama Islam", teacherName: "Lina Marlina, S.Ag", gradeName: "VII-A", room: "R.Agama" },
  { id: 7, day: "Rabu", startTime: "07:00", endTime: "08:30", subjectName: "Matematika", teacherName: "Dr. Surya Darma, M.Pd", gradeName: "VII-B", room: "R.102" },
  { id: 8, day: "Rabu", startTime: "08:30", endTime: "10:00", subjectName: "Informatika", teacherName: "Mega Puspita, S.Kom", gradeName: "VII-A", room: "R.Komputer" },
  { id: 9, day: "Kamis", startTime: "07:00", endTime: "08:30", subjectName: "Pendidikan Jasmani", teacherName: "Bambang Suryanto, S.Pd", gradeName: "VII-A", room: "Lapangan" },
  { id: 10, day: "Kamis", startTime: "08:30", endTime: "10:00", subjectName: "Bahasa Indonesia", teacherName: "Hj. Rahmawati, S.Pd", gradeName: "VII-B", room: "R.102" },
  { id: 11, day: "Jumat", startTime: "07:00", endTime: "08:30", subjectName: "IPA", teacherName: "Andi Wijaya, S.Si", gradeName: "VII-B", room: "R.Lab" },
  { id: 12, day: "Jumat", startTime: "08:30", endTime: "10:00", subjectName: "Bahasa Inggris", teacherName: "Sari Indah, S.Pd", gradeName: "VII-B", room: "R.102" },
];

export const attendances: Attendance[] = [
  { id: 1, studentId: 1, studentName: "Ahmad Fadillah", gradeName: "VII-A", date: "2025-10-20", status: "hadir" },
  { id: 2, studentId: 2, studentName: "Siti Nurhaliza", gradeName: "VII-A", date: "2025-10-20", status: "hadir" },
  { id: 3, studentId: 3, studentName: "Muhammad Rizki", gradeName: "VII-B", date: "2025-10-20", status: "sakit", note: "Demam" },
  { id: 4, studentId: 4, studentName: "Aisyah Putri", gradeName: "VII-B", date: "2025-10-20", status: "hadir" },
  { id: 5, studentId: 5, studentName: "Dimas Prasetyo", gradeName: "VIII-A", date: "2025-10-20", status: "izin", note: "Acara keluarga" },
  { id: 6, studentId: 6, studentName: "Fatimah Zahra", gradeName: "VIII-A", date: "2025-10-20", status: "hadir" },
  { id: 7, studentId: 7, studentName: "Reza Firmansyah", gradeName: "VIII-B", date: "2025-10-20", status: "alpa" },
  { id: 8, studentId: 8, studentName: "Nurul Aini", gradeName: "IX-A", date: "2025-10-20", status: "hadir" },
  { id: 9, studentId: 9, studentName: "Bayu Setiawan", gradeName: "IX-A", date: "2025-10-20", status: "hadir" },
  { id: 10, studentId: 10, studentName: "Dewi Lestari", gradeName: "IX-B", date: "2025-10-20", status: "hadir" },
  { id: 11, studentId: 11, studentName: "Ilham Maulana", gradeName: "VII-A", date: "2025-10-20", status: "sakit", note: "Flu" },
  { id: 12, studentId: 12, studentName: "Rahma Wati", gradeName: "VII-B", date: "2025-10-20", status: "hadir" },
];

export const scores: Score[] = [
  { id: 1, studentId: 1, studentName: "Ahmad Fadillah", gradeName: "VII-A", subjectName: "Matematika", type: "Tugas", score: 85, maxScore: 100, date: "2025-10-15" },
  { id: 2, studentId: 1, studentName: "Ahmad Fadillah", gradeName: "VII-A", subjectName: "Matematika", type: "UTS", score: 78, maxScore: 100, date: "2025-10-10" },
  { id: 3, studentId: 2, studentName: "Siti Nurhaliza", gradeName: "VII-A", subjectName: "Matematika", type: "Tugas", score: 92, maxScore: 100, date: "2025-10-15" },
  { id: 4, studentId: 2, studentName: "Siti Nurhaliza", gradeName: "VII-A", subjectName: "Bahasa Indonesia", type: "UTS", score: 88, maxScore: 100, date: "2025-10-10" },
  { id: 5, studentId: 3, studentName: "Muhammad Rizki", gradeName: "VII-B", subjectName: "IPA", type: "Kuis", score: 75, maxScore: 100, date: "2025-10-12" },
  { id: 6, studentId: 4, studentName: "Aisyah Putri", gradeName: "VII-B", subjectName: "Bahasa Inggris", type: "Tugas", score: 90, maxScore: 100, date: "2025-10-15" },
  { id: 7, studentId: 5, studentName: "Dimas Prasetyo", gradeName: "VIII-A", subjectName: "Matematika", type: "UAS", score: 82, maxScore: 100, date: "2025-10-18" },
  { id: 8, studentId: 6, studentName: "Fatimah Zahra", gradeName: "VIII-A", subjectName: "IPS", type: "Tugas", score: 95, maxScore: 100, date: "2025-10-15" },
  { id: 9, studentId: 8, studentName: "Nurul Aini", gradeName: "IX-A", subjectName: "Bahasa Indonesia", type: "UTS", score: 87, maxScore: 100, date: "2025-10-10" },
  { id: 10, studentId: 9, studentName: "Bayu Setiawan", gradeName: "IX-A", subjectName: "IPA", type: "Kuis", score: 70, maxScore: 100, date: "2025-10-12" },
];

export const announcements: Announcement[] = [
  { id: 1, title: "Jadwal UTS Semester Ganjil 2025/2026", content: "Ujian Tengah Semester Ganjil akan dilaksanakan pada tanggal 3-10 November 2025. Seluruh siswa diharapkan mempersiapkan diri dengan baik.", author: "Admin", target: "all", priority: "important", createdAt: "2025-10-18", isPublished: true },
  { id: 2, title: "Rapat Wali Murid Kelas VII", content: "Rapat wali murid kelas VII akan diadakan pada hari Sabtu, 25 Oktober 2025 pukul 09:00 WIB di Aula Sekolah.", author: "Admin", target: "guardian", priority: "normal", createdAt: "2025-10-17", isPublished: true },
  { id: 3, title: "Pelatihan Google Classroom untuk Guru", content: "Pelatihan penggunaan Google Classroom akan diadakan pada hari Kamis, 23 Oktober 2025. Seluruh guru wajib hadir.", author: "Admin", target: "teacher", priority: "important", createdAt: "2025-10-16", isPublished: true },
  { id: 4, title: "Libur Hari Pahlawan", content: "Sekolah libur pada tanggal 10 November 2025 dalam rangka memperingati Hari Pahlawan.", author: "Admin", target: "all", priority: "normal", createdAt: "2025-10-15", isPublished: true },
  { id: 5, title: "Perlombaan HUT RI (Draft)", content: "Rangkaian kegiatan perlombaan dalam rangka HUT RI ke-80.", author: "Admin", target: "student", priority: "normal", createdAt: "2025-10-14", isPublished: false },
];

export const dashboardStats = {
  totalStudents: 183,
  totalTeachers: 24,
  totalGrades: 6,
  totalSubjects: 8,
  attendanceRate: 94.5,
  averageScore: 83.2,
};

export const attendanceChartData = [
  { month: "Juli", hadir: 95, izin: 3, sakit: 1, alpa: 1 },
  { month: "Agu", hadir: 93, izin: 4, sakit: 2, alpa: 1 },
  { month: "Sep", hadir: 96, izin: 2, sakit: 1, alpa: 1 },
  { month: "Okt", hadir: 94, izin: 3, sakit: 2, alpa: 1 },
  { month: "Nov", hadir: 91, izin: 4, sakit: 3, alpa: 2 },
  { month: "Des", hadir: 97, izin: 2, sakit: 1, alpa: 0 },
];
