"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  Loader2,
  Trash2,
  BookOpen,
  X,
  TrendingUp,
  Target,
  BarChart3,
  Filter
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/apiService";
import { formatDate, cn } from "@/lib/utils";

const GRADE_TYPES = [
  { value: "Tugas", label: "Tugas" },
  { value: "Kuis", label: "Kuis" },
  { value: "UTS", label: "UTS" },
  { value: "UAS", label: "UAS" },
];

const getGradeBadge = (score: number, max: number = 100) => {
  const pct = (score / max) * 100;
  if (pct >= 80) return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", label: "Baik" };
  if (pct >= 60) return { cls: "bg-amber-100 text-amber-700 border-amber-200", label: "Cukup" };
  return { cls: "bg-rose-100 text-rose-700 border-rose-200", label: "Kurang" };
};

export default function GradesPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  // Filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterType, setFilterType] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    type: "",
    score: "",
    maxScore: "100",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const teacher = parsed.role === "teacher";
        setIsTeacher(teacher);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (isTeacher) {
      fetchTeacherFilters();
    } else {
      fetchStudentSubjects();
    }
    fetchGrades();
  }, [isTeacher]);

  const fetchStudentSubjects = async () => {
    try {
      const res = await apiService.getAll("/hub/student-subjects");
      setSubjects(res.data || []);
    } catch (e) {}
  };

  const fetchTeacherFilters = async () => {
    try {
      const [subsRes, classesRes] = await Promise.all([
        apiService.getAll("/hub/teacher-subjects"),
        apiService.getAll("/hub/teacher-classes"),
      ]);
      setSubjects(subsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (e) {}
  };

  const fetchStudentsForClass = async (classId: string) => {
    if (!classId) { setStudents([]); return; }
    try {
      const res = await apiService.getById("/classes", classId);
      setStudents(res.data?.students || []);
    } catch (e) {}
  };

  const fetchGrades = async (params?: Record<string, string>) => {
    setLoading(true);
    setError("");
    try {
      const query: any = {};
      if (params?.subjectId) query.subjectId = params.subjectId;
      if (params?.classId) query.classId = params.classId;
      if (params?.type) query.type = params.type;

      const res = await apiService.getAll("/hub/grades", query);
      setGrades(res.data || []);
    } catch (e) {
      setError("Gagal memuat data nilai.");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    fetchGrades({
      subjectId: filterSubject,
      classId: filterClass,
      type: filterType,
    });
  };

  const handleSaveGrade = async () => {
    if (!form.studentId || !form.subjectId || !form.type || !form.score) {
      alert("Harap lengkapi semua field yang diperlukan.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiService.create("/hub/grades", {
        studentId: Number(form.studentId),
        subjectId: Number(form.subjectId),
        type: form.type,
        score: Number(form.score),
        maxScore: Number(form.maxScore) || 100,
        date: form.date,
      });
      setSuccessMsg("Nilai berhasil disimpan.");
      setIsModalOpen(false);
      setForm({ studentId: "", subjectId: "", type: "", score: "", maxScore: "100", date: new Date().toISOString().split("T")[0] });
      fetchGrades();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal menyimpan nilai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGrade = async (id: number) => {
    if (!confirm("Hapus nilai ini?")) return;
    try {
      await apiService.remove("/hub/grades", id);
      setSuccessMsg("Nilai berhasil dihapus.");
      fetchGrades();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e: any) {
      alert(e.response?.data?.message || "Gagal menghapus nilai.");
    }
  };

  // Student stats
  const avgScore = grades.length > 0
    ? grades.reduce((a, g) => a + (g.score / (g.maxScore || 100)) * 100, 0) / grades.length
    : 0;
  const highest = grades.length > 0 ? Math.max(...grades.map(g => (g.score / (g.maxScore || 100)) * 100)) : 0;
  const lowest = grades.length > 0 ? Math.min(...grades.map(g => (g.score / (g.maxScore || 100)) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isTeacher ? "Manajemen Nilai" : "Nilai Saya"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher
              ? "Input dan kelola nilai tugas, UTS, serta UAS siswa"
              : "Rekap nilai semua mata pelajaran Anda"}
          </p>
        </div>
        {isTeacher && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            Input Nilai Baru
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")}><X size={16} /></button>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Student Summary Cards */}
      {!isTeacher && grades.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 border-l-4 border-l-indigo-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rata-rata</p>
                <p className="text-4xl font-black text-indigo-700 mt-1">{Math.round(avgScore)}</p>
                <p className="text-xs text-muted-foreground mt-1">dari 100</p>
              </div>
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600"><BarChart3 size={22} /></div>
            </div>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tertinggi</p>
                <p className="text-4xl font-black text-emerald-700 mt-1">{Math.round(highest)}</p>
                <p className="text-xs text-muted-foreground mt-1">nilai terbaik</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600"><TrendingUp size={22} /></div>
            </div>
          </Card>
          <Card className="p-5 border-l-4 border-l-amber-600">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Terendah</p>
                <p className="text-4xl font-black text-amber-700 mt-1">{Math.round(lowest)}</p>
                <p className="text-xs text-muted-foreground mt-1">perlu ditingkatkan</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-100 text-amber-600"><Target size={22} /></div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mr-2">
            <Filter size={16} /> Filter:
          </div>
          {subjects.length > 0 && (
            <div className="w-44">
              <Select
                placeholder="Semua Mapel"
                options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                value={filterSubject}
                onChange={e => setFilterSubject(e.target.value)}
              />
            </div>
          )}
          {isTeacher && classes.length > 0 && (
            <div className="w-40">
              <Select
                placeholder="Semua Kelas"
                options={classes.map(c => ({ value: String(c.id), label: c.name }))}
                value={filterClass}
                onChange={e => {
                  setFilterClass(e.target.value);
                  fetchStudentsForClass(e.target.value);
                }}
              />
            </div>
          )}
          <div className="w-36">
            <Select
              placeholder="Semua Tipe"
              options={GRADE_TYPES}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={applyFilters}>Terapkan</Button>
          {(filterSubject || filterClass || filterType) && (
            <Button size="sm" variant="secondary" onClick={() => {
              setFilterSubject(""); setFilterClass(""); setFilterType("");
              fetchGrades();
            }}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {isTeacher && (
                  <>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nama Siswa</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">NIS</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kelas</th>
                  </>
                )}
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Mata Pelajaran</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipe</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Nilai</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Persentase</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tanggal</th>
                {isTeacher && <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isTeacher ? 9 : 5} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                    <p className="text-muted-foreground mt-2 text-sm">Memuat data nilai...</p>
                  </td>
                </tr>
              ) : grades.length > 0 ? (
                grades.map(grade => {
                  const pct = Math.round((grade.score / (grade.maxScore || 100)) * 100);
                  const badge = getGradeBadge(grade.score, grade.maxScore || 100);
                  return (
                    <tr key={grade.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                      {isTeacher && (
                        <>
                          <td className="py-3 px-4 font-medium">{grade.student?.name || "-"}</td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">{grade.student?.nis || "-"}</td>
                          <td className="py-3 px-4 text-xs">
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded font-medium">
                              {grade.student?.class?.name || "-"}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-teal-500 shrink-0" />
                          <span className="font-medium">{grade.subject?.name || "-"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] font-bold uppercase tracking-wider bg-muted px-2 py-0.5 rounded">
                          {grade.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-base">{grade.score}</span>
                        <span className="text-muted-foreground text-xs">/{grade.maxScore || 100}</span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn("text-[11px] font-bold px-2.5 py-1 rounded-full border", badge.cls)}>
                          {pct}% · {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{formatDate(grade.date)}</td>
                      {isTeacher && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteGrade(grade.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isTeacher ? 9 : 5} className="py-20 text-center">
                    <Award size={48} className="mx-auto text-muted-foreground/20 mb-3" />
                    <p className="font-semibold text-foreground">
                      {isTeacher ? "Belum ada nilai tercatat" : "Belum ada nilai tersedia"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isTeacher
                        ? "Klik 'Input Nilai Baru' untuk mulai menambahkan nilai siswa."
                        : "Nilai akan muncul di sini setelah guru menginput penilaian."}
                    </p>
                    {isTeacher && (
                      <Button className="mt-4" onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> Input Nilai Pertama
                      </Button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Input Nilai */}
      {isTeacher && (
        <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Input Nilai Siswa">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Kelas"
                placeholder="Pilih kelas..."
                options={classes.map(c => ({ value: String(c.id), label: c.name }))}
                value={filterClass}
                onChange={e => {
                  setFilterClass(e.target.value);
                  fetchStudentsForClass(e.target.value);
                }}
              />
              <Select
                label="Mata Pelajaran"
                placeholder="Pilih mapel..."
                options={subjects.map(s => ({ value: String(s.id), label: s.name }))}
                value={form.subjectId}
                onChange={e => setForm({ ...form, subjectId: e.target.value })}
              />
            </div>
            <Select
              label="Nama Siswa"
              placeholder={students.length > 0 ? "Pilih siswa..." : "Pilih kelas dulu..."}
              options={students.map(s => ({ value: String(s.id), label: `${s.name} (${s.nis})` }))}
              value={form.studentId}
              onChange={e => setForm({ ...form, studentId: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Tipe Penilaian"
                placeholder="Pilih tipe..."
                options={GRADE_TYPES}
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              />
              <Input
                label="Tanggal"
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Nilai"
                type="number"
                placeholder="0"
                min={0}
                value={form.score}
                onChange={e => setForm({ ...form, score: e.target.value })}
              />
              <Input
                label="Nilai Maksimal"
                type="number"
                placeholder="100"
                min={1}
                value={form.maxScore}
                onChange={e => setForm({ ...form, maxScore: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</Button>
              <Button
                onClick={handleSaveGrade}
                disabled={isSubmitting || !form.studentId || !form.subjectId || !form.type || !form.score}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Nilai"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
