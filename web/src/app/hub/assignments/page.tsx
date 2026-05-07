"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  ClipboardList,
  Calendar,
  Trash2,
  Loader2,
  Users,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  LayoutGrid,
  TrendingUp,
  History
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { apiService } from "@/services/apiService";
import { formatDate, cn } from "@/lib/utils";

// === 1. DATA DUMMY ===
const DUMMY_ASSIGNMENTS = [
  {
    id: 1,
    title: "Latihan Soal Persamaan Linear",
    description: "Kerjakan soal nomor 1-10 dari buku paket halaman 45",
    subject: { name: "Matematika" },
    class: { name: "IX-A" },
    teacher: { name: "Yulhendri, S.Pd" },
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    submittedCount: 18,
    totalStudents: 32,
    studentSubmission: { submitted: false, submittedAt: null }
  },
  {
    id: 2,
    title: "Essay Sejarah Kemerdekaan Indonesia",
    description: "Tulis essay minimal 500 kata tentang perjuangan kemerdekaan",
    subject: { name: "Sejarah" },
    class: { name: "IX-B" },
    teacher: { name: "Yulhendri, S.Pd" },
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    submittedCount: 30,
    totalStudents: 30,
    studentSubmission: { submitted: true, submittedAt: new Date().toISOString() }
  },
  {
    id: 3,
    title: "Praktikum Struktur Data Stack",
    description: "Implementasikan struktur data stack menggunakan array",
    subject: { name: "Informatika" },
    class: { name: "X-A" },
    teacher: { name: "Yulhendri, S.Pd" },
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    submittedCount: 5,
    totalStudents: 35,
    studentSubmission: { submitted: false, submittedAt: null }
  }
];

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTeacher, setIsTeacher] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    subject: "Matematika",
    className: "IX-A",
    dueDate: ""
  });

  // Filters state
  const [activeFilter, setActiveFilter] = useState("Semua");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setIsTeacher(parsed.role === "teacher");
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiService.getAll("/hub/assignments");
      const data = response.data;
      setAssignments(data.length > 0 ? data : DUMMY_ASSIGNMENTS);
    } catch (error) {
      console.error(error);
      // === 1. FALLBACK KE DUMMY ===
      setAssignments(DUMMY_ASSIGNMENTS);
    } finally {
      setLoading(false);
    }
  };

  // === 2. HANDLER BUAT TUGAS BARU ===
  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.dueDate) {
      alert("Judul dan Tenggat Waktu wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      const assignmentToAdd = {
        id: Math.floor(Math.random() * 10000),
        title: newAssignment.title,
        description: newAssignment.description,
        subject: { name: newAssignment.subject },
        class: { name: newAssignment.className },
        teacher: { name: "Yulhendri, S.Pd" }, // Assume current user
        dueDate: new Date(newAssignment.dueDate).toISOString(),
        submittedCount: 0,
        totalStudents: 30,
        studentSubmission: { submitted: false, submittedAt: null }
      };

      // Simulasi delay API
      await new Promise(resolve => setTimeout(resolve, 800));

      setAssignments([assignmentToAdd, ...assignments]);
      setIsCreateModalOpen(false);
      setNewAssignment({
        title: "",
        description: "",
        subject: "Matematika",
        className: "IX-A",
        dueDate: ""
      });
    } catch (err) {
      alert("Gagal membuat tugas");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === 3. STATISTIK (GURU) ===
  const getStats = () => {
    const total = assignments.length;
    const active = assignments.filter(a => new Date(a.dueDate) >= new Date()).length;
    const avgSubmission = total > 0
      ? assignments.reduce((acc, curr) => acc + (curr.submittedCount / curr.totalStudents), 0) / total * 100
      : 0;

    return { total, active, avgSubmission };
  };

  const stats = getStats();

  const getDeadlineStatus = (dueDate: string) => {
    const now = new Date();
    const deadline = new Date(dueDate);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return { label: "Selesai", color: "bg-gray-100 text-gray-700 border-gray-300" };
    if (diffDays <= 2) return { label: "Mendesak", color: "bg-rose-100 text-rose-700 border-rose-300" };
    return { label: "Aktif", color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
  };

  // Get progress bar color based on percentage
  const getProgressBarColor = (percentage: number) => {
    if (percentage < 40) return "bg-rose-500";
    if (percentage < 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  // Filter logic for students
  const filteredAssignments = assignments.filter(a => {
    if (isTeacher) return true;
    if (activeFilter === "Belum Dikerjakan") return !a.studentSubmission?.submitted;
    if (activeFilter === "Sudah Dikerjakan") return a.studentSubmission?.submitted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-muted-foreground">
        <Loader2 className="animate-spin mb-4 text-indigo-600" size={40} />
        <p className="animate-pulse">Memuat daftar tugas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isTeacher ? "Manajemen Tugas" : "Tugas Saya"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Kelola tugas, deadline, dan pengumpulan karya siswa"
              : "Daftar tugas yang harus Anda kerjakan"}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} />
            Buat Tugas Baru
          </Button>
        )}
      </div>

      {/* === 3. STATISTIK KARTU (GURU ONLY) === */}
      {isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-l-4 border-l-indigo-600 shadow-sm hover:shadow-lg hover:border-l-indigo-700 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Tugas</p>
                <h3 className="text-4xl font-bold text-foreground">{stats.total}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Semua tugas yang telah dibuat untuk siswa Anda</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 flex-shrink-0">
                <LayoutGrid size={24} />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-emerald-600 shadow-sm hover:shadow-lg hover:border-l-emerald-700 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pengumpulan</p>
                <h3 className="text-4xl font-bold text-foreground">
                  {Math.round(stats.avgSubmission)}%
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Rata-rata tingkat pengumpulan siswa</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 flex-shrink-0">
                <TrendingUp size={24} />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-l-4 border-l-amber-600 shadow-sm hover:shadow-lg hover:border-l-amber-700 transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tugas Aktif</p>
                <h3 className="text-4xl font-bold text-foreground">{stats.active}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">Menunggu pengumpulan dari siswa</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600 flex-shrink-0">
                <History size={24} />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* === 6. FILTER (SISWA ONLY) === */}
      {!isTeacher && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["Semua", "Belum Dikerjakan", "Sudah Dikerjakan"].map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="whitespace-nowrap"
            >
              {filter}
            </Button>
          ))}
        </div>
      )}

      {/* Daftar Tugas */}
      <div className="space-y-4">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => {
            const isSubmitted = assignment.studentSubmission?.submitted || false;
            const submissionDate = assignment.studentSubmission?.submittedAt;
            const isOverdue = new Date(assignment.dueDate) < new Date();
            const status = getDeadlineStatus(assignment.dueDate);
            const progress = (assignment.submittedCount / assignment.totalStudents) * 100;

            return (
              <Card
                key={assignment.id}
                className={cn(
                  "overflow-hidden transition-all duration-300 shadow-sm hover:shadow-xl border border-border hover:border-indigo-300",
                  isTeacher && "hover:border-amber-300"
                )}
              >
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                    {/* Content Section */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={cn(
                        "p-3 rounded-lg flex-shrink-0 shadow-sm",
                        isTeacher ? "bg-amber-100 text-amber-600" :
                          (isSubmitted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600')
                      )}>
                        <ClipboardList size={22} />
                      </div>
                      <div className="flex-1 space-y-2.5 min-w-0">
                        {/* Title & Status Row */}
                        <div className="flex items-start flex-wrap gap-2 gap-y-1.5">
                          <h3 className="font-bold text-base leading-tight text-foreground break-words flex-1">{assignment.title}</h3>

                          {isTeacher && (
                            <span className={cn(
                              "text-[10px] font-bold px-3 py-1.5 rounded-full border inline-flex items-center gap-1 shadow-sm flex-shrink-0",
                              status.color
                            )}>
                              {status.label === "Selesai" && "✓"}
                              {status.label === "Mendesak" && "!"}
                              {status.label === "Aktif" && "→"}
                              {status.label}
                            </span>
                          )}

                          {!isTeacher && isSubmitted && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm flex-shrink-0">
                              <CheckCircle2 size={13} /> Dikerjakan
                            </span>
                          )}
                          {!isTeacher && !isSubmitted && isOverdue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shadow-sm flex-shrink-0">
                              <AlertCircle size={13} /> Terlambat
                            </span>
                          )}
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 whitespace-nowrap">
                            {assignment.subject?.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium whitespace-nowrap">
                            {isTeacher ? <Users size={13} /> : <User size={13} />}
                            {isTeacher ? assignment.class?.name : assignment.teacher?.name}
                          </span>
                          {isTeacher && (
                            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
                              {assignment.submittedCount || 0}/{assignment.totalStudents || 0}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {assignment.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {isTeacher && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Progress</span>
                              <span className={cn("text-sm font-bold px-2.5 py-1 rounded-full", 
                                progress < 40 ? "bg-rose-100 text-rose-700" :
                                progress < 70 ? "bg-amber-100 text-amber-700" :
                                "bg-emerald-100 text-emerald-700"
                              )}>
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-border/50">
                              <div
                                className={cn("h-full transition-all duration-700 ease-out rounded-full", getProgressBarColor(progress))}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-wrap items-center gap-3 md:gap-4 md:flex-col md:items-end md:flex-nowrap flex-shrink-0 w-full md:w-auto">
                      <div className="flex flex-col md:items-end gap-1.5">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tenggat</p>
                        <div className={cn(
                          "flex items-center gap-1.5 font-bold text-sm whitespace-nowrap",
                          isOverdue && !isSubmitted ? 'text-rose-600' : 'text-amber-600'
                        )}>
                          <Calendar size={16} />
                          <span>{formatDate(assignment.dueDate)}</span>
                        </div>
                        {!isTeacher && submissionDate && (
                          <p className="text-[10px] text-muted-foreground font-medium">
                            Dikerjakan: {formatDate(submissionDate)}
                          </p>
                        )}
                      </div>
                      <div className="hidden md:block h-8 w-px bg-border"></div>
                      <div className="flex gap-2 w-full md:w-auto flex-wrap md:flex-nowrap justify-end">
                        {isTeacher ? (
                          <>
                            <Button variant="secondary" size="sm" className="text-xs">Lihat</Button>
                            <Button variant="secondary" size="sm" className="text-xs">Edit</Button>
                            <button className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all duration-200 border border-transparent hover:border-red-200">
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <Button variant={isSubmitted ? "secondary" : "primary"} size="sm" className="w-full md:w-auto text-xs">
                            {isSubmitted ? "Lihat Hasil" : "Kerjakan"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-border rounded-3xl bg-gradient-to-br from-card to-muted/20">
            <div className="inline-flex p-5 rounded-2xl bg-indigo-50 text-indigo-600 mb-6 shadow-sm">
              <ClipboardList size={40} />
            </div>
            <h3 className="text-2xl font-bold text-foreground">
              {isTeacher ? "Mulai Membuat Tugas Baru" : "Belum Ada Tugas Tersedia"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mt-3 leading-relaxed">
              {isTeacher
                ? "Tidak ada tugas yang dibuat sekarang. Klik tombol 'Buat Tugas Baru' di atas untuk memulai memberikan tugas kepada siswa Anda."
                : "Guru belum memberikan tugas untuk kelas Anda. Pantau halaman ini secara berkala untuk tugas terbaru."}
            </p>
            {isTeacher && (
              <Button className="mt-6" onClick={() => setIsCreateModalOpen(true)}>
                <Plus size={16} />
                Buat Tugas Pertama
              </Button>
            )}
          </div>
        )}
      </div>

      {/* === 2. MODAL BUAT TUGAS (GURU) === */}
      {isTeacher && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Buat Tugas Baru"
        >
          <div className="p-6 space-y-4">
            <Input
              label="Judul Tugas"
              placeholder="Masukkan judul tugas..."
              required
              value={newAssignment.title}
              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
            />

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">Deskripsi (Opsional)</label>
              <textarea
                className="flex min-h-[100px] w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Berikan instruksi detail tugas..."
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Mata Pelajaran"
                value={newAssignment.subject}
                onChange={(e) => setNewAssignment({ ...newAssignment, subject: e.target.value })}
                options={[
                  { value: "Matematika", label: "Matematika" },
                  { value: "Bahasa Indonesia", label: "Bahasa Indonesia" },
                  { value: "IPA", label: "IPA" },
                  { value: "IPS", label: "IPS" },
                  { value: "Informatika", label: "Informatika" },
                ]}
              />
              <Select
                label="Kelas"
                value={newAssignment.className}
                onChange={(e) => setNewAssignment({ ...newAssignment, className: e.target.value })}
                options={[
                  { value: "VII-A", label: "VII-A" },
                  { value: "VII-B", label: "VII-B" },
                  { value: "VIII-A", label: "VIII-A" },
                  { value: "VIII-B", label: "VIII-B" },
                  { value: "IX-A", label: "IX-A" },
                  { value: "IX-B", label: "IX-B" },
                ]}
              />
            </div>

            <Input
              label="Tenggat Waktu"
              type="date"
              required
              value={newAssignment.dueDate}
              onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={isSubmitting || !newAssignment.title || !newAssignment.dueDate}
              >
                {isSubmitting ? <Loader2 className="animate-spin size={16}" /> : "Buat Tugas"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
