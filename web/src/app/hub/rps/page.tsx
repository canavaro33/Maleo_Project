"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClipboardCheck,
  Plus,
  BookOpen,
  Calendar,
  Layers,
  FileSpreadsheet,
  Download,
  Upload,
  FileJson,
  Trash2,
  Archive,
  CheckCircle,
  AlertCircle,
  Eye,
  Loader2,
  RefreshCw,
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Settings,
  ShieldAlert,
  UserCheck
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { apiService } from "@/services/apiService";
import api from "@/lib/axios";
import toast from "react-hot-toast";

export default function RpsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [rpsList, setRpsList] = useState<any[]>([]);
  const [mySubjects, setMySubjects] = useState<any[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSubjectManagerOpen, setIsSubjectManagerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedRpsIdForImport, setSelectedRpsIdForImport] = useState<number | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Subject Manager form
  const [selectedSubjectToBind, setSelectedSubjectToBind] = useState("");

  // Wizard Multi-step State (6 Steps)
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    academicYearId: "",
    subjectId: "",
    classId: "",
    totalMeetings: 16,
    learningObjective: "",
    learningStrategy: "",
    teacherNote: ""
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role !== "teacher") {
          window.location.href = "/hub/dashboard";
          return;
        }
        setUser(parsed);
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }
  }, []);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const isTeacher = user.role === "teacher";
      const isStudent = user.role === "student";

      if (isTeacher) {
        // Load data guru
        const [rpsRes, subjectsRes, allSubsRes, classesRes, yearsRes] = await Promise.all([
          apiService.getAll("/rps"),
          apiService.getAll("/rps/my-subjects"),
          apiService.getAll("/lms/subjects"), // load all subjects to register
          apiService.getAll("/lms/classes"),
          apiService.getAll("/academic-years")
        ]);

        setRpsList(rpsRes.data || []);
        setMySubjects(subjectsRes.data || []);
        setAllSubjects(allSubsRes.data || []);
        setClasses(classesRes.data || []);
        setAcademicYears(yearsRes.data || []);

        // Pre-select active academic year
        const activeYear = (yearsRes.data || []).find((y: any) => y.isActive);
        if (activeYear) {
          setWizardForm(prev => ({ ...prev, academicYearId: activeYear.id.toString() }));
        }
      } else if (isStudent) {
        // Load data siswa
        const rpsRes = await apiService.getAll("/rps/student/my-rps");
        setRpsList(rpsRes.data || []);
      }
    } catch (err: any) {
      console.error("[Fetch RPS Data Error]", err);
      setError("Gagal memuat data. Pastikan koneksi internet stabil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  // ══════════════════════════════════════════════
  // SUBJECT MANAGER FUNCTIONS
  // ══════════════════════════════════════════════

  const handleBindSubject = async () => {
    if (!selectedSubjectToBind) {
      toast.error("Pilih mata pelajaran terlebih dahulu.");
      return;
    }
    setActionLoading("bind-subject");
    try {
      await apiService.create("/rps/my-subjects", { subjectId: selectedSubjectToBind });
      toast.success("Mata pelajaran berhasil ditambahkan.");
      setSelectedSubjectToBind("");
      // Refresh subjects
      const subjectsRes = await apiService.getAll("/rps/my-subjects");
      setMySubjects(subjectsRes.data || []);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || "Gagal mengampu mata pelajaran.";
      toast.error(errMsg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnbindSubject = async (subjectId: number) => {
    if (!confirm("Apakah Anda yakin ingin melepas mata pelajaran ini dari daftar ampu?")) return;
    setActionLoading(`unbind-${subjectId}`);
    try {
      await api.delete(`/rps/my-subjects/${subjectId}`);
      toast.success("Mata pelajaran berhasil dilepas.");
      // Refresh subjects
      const subjectsRes = await apiService.getAll("/rps/my-subjects");
      setMySubjects(subjectsRes.data || []);
    } catch (err: any) {
      toast.error("Gagal melepas mata pelajaran.");
    } finally {
      setActionLoading(null);
    }
  };

  // ══════════════════════════════════════════════
  // RPS WIZARD SETUP FUNCTIONS
  // ══════════════════════════════════════════════

  const handleNextStep = () => {
    if (wizardStep === 1 && !wizardForm.academicYearId) {
      toast.error("Silakan pilih Tahun Ajaran & Semester.");
      return;
    }
    if (wizardStep === 2 && !wizardForm.subjectId) {
      toast.error("Silakan pilih Mata Pelajaran.");
      return;
    }
    if (wizardStep === 3 && !wizardForm.classId) {
      toast.error("Silakan pilih Kelas target.");
      return;
    }
    if (wizardStep === 4 && (!wizardForm.totalMeetings || wizardForm.totalMeetings < 1 || wizardForm.totalMeetings > 52)) {
      toast.error("Jumlah pertemuan harus antara 1 sampai 52.");
      return;
    }
    setWizardStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setWizardStep(prev => prev - 1);
  };

  const handleGenerateRps = async () => {
    setActionLoading("generate-rps");
    try {
      const res = await apiService.create("/rps/generate", {
        subjectId: Number(wizardForm.subjectId),
        classId: Number(wizardForm.classId),
        academicYearId: Number(wizardForm.academicYearId),
        totalMeetings: Number(wizardForm.totalMeetings),
        learningObjective: wizardForm.learningObjective || null,
        learningStrategy: wizardForm.learningStrategy || null,
        teacherNote: wizardForm.teacherNote || null
      });

      toast.success(res.message || "RPS berhasil di-generate!");
      setIsWizardOpen(false);
      // Reset form & step
      setWizardStep(1);
      setWizardForm({
        academicYearId: "",
        subjectId: "",
        classId: "",
        totalMeetings: 16,
        learningObjective: "",
        learningStrategy: "",
        teacherNote: ""
      });
      // Fetch new list
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal membuat RPS baru.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // ══════════════════════════════════════════════
  // RPS ACTIONS (PUBLISH, ARCHIVE, DELETE, EXPORT)
  // ══════════════════════════════════════════════

  const handlePublishRps = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin mempublikasikan RPS ini? Siswa di kelas terkait akan langsung dapat melihat seluruh detail dan materi pertemuan.")) return;
    setActionLoading(`publish-${id}`);
    try {
      await api.put(`/rps/${id}/publish`);
      toast.success("RPS berhasil dipublikasikan ke siswa!");
      fetchData();
    } catch (err) {
      toast.error("Gagal mempublikasikan RPS.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchiveRps = async (id: number) => {
    if (!confirm("Arsipkan RPS ini? Status RPS akan berubah menjadi Archived.")) return;
    setActionLoading(`archive-${id}`);
    try {
      await api.put(`/rps/${id}/archive`);
      toast.success("RPS berhasil diarsipkan.");
      fetchData();
    } catch (err) {
      toast.error("Gagal mengarsipkan RPS.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRps = async (id: number) => {
    if (!confirm("PERINGATAN! Menghapus RPS ini akan menghapus semua data pertemuan, data materi, dan log akses siswa yang terkait secara permanen. Apakah Anda benar-benar yakin?")) return;
    setActionLoading(`delete-${id}`);
    try {
      await api.delete(`/rps/${id}`);
      toast.success("RPS berhasil dihapus secara permanen.");
      fetchData();
    } catch (err) {
      toast.error("Gagal menghapus RPS.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadExcelTemplate = () => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"}/rps/template/excel`;
    window.open(url, "_blank");
  };

  const handleExportBundle = async (id: number, subjectName: string) => {
    try {
      const res = await apiService.getAll(`/rps/${id}/bundle`);
      if (res.success && res.data) {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `RPS_Bundle_${subjectName.replace(/\s+/g, "_")}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success("Bundle RPS JSON berhasil diunduh.");
      }
    } catch (err) {
      toast.error("Gagal mengekspor bundle RPS.");
    }
  };

  const handleImportExcel = async () => {
    if (!importFile || !selectedRpsIdForImport) {
      toast.error("Silakan pilih file Excel template.");
      return;
    }
    setActionLoading("import-excel");
    try {
      const formData = new FormData();
      formData.append("excel", importFile);

      const res = await api.post(`/rps/${selectedRpsIdForImport}/import-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Import file Excel berhasil!");
        setIsImportModalOpen(false);
        setImportFile(null);
        setSelectedRpsIdForImport(null);
        fetchData();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Gagal mengimport file Excel.";
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Stats calculation
  const totalRps = rpsList.length;
  const publishedRps = rpsList.filter(r => r.status === "published").length;
  const draftRps = rpsList.filter(r => r.status === "draft").length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-950 p-8 text-white shadow-xl shadow-teal-950/20">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-teal-500/10 blur-2xl"></div>
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/20 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-sm">
              <Sparkles size={12} />
              Kurikulum Merdeka 2026
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Rencana Pembelajaran Semester (RPS)
            </h1>
            <p className="text-sm md:text-base text-teal-100/80 max-w-2xl font-light">
              {isTeacher
                ? "Generate struktur modul, atur alur & tujuan pembelajaran (ATP), rancang materi pertemuan, serta publikasikan langsung ke siswa Anda."
                : "Akses rencana pembelajaran semester, alur materi belajar, serta target capaian pembelajaran kelas Anda."}
            </p>
          </div>

          {isTeacher && (
            <div className="flex flex-wrap gap-3 shrink-0">
              <Button
                onClick={() => setIsSubjectManagerOpen(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl flex items-center gap-2 transition-all font-medium backdrop-blur-md px-4 h-11"
              >
                <Settings size={18} />
                Mata Pelajaran Anda ({mySubjects.length}/2)
              </Button>
              <Button
                onClick={() => {
                  if (mySubjects.length === 0) {
                    toast.error("Silakan daftarkan mata pelajaran yang Anda ampu terlebih dahulu.");
                    setIsSubjectManagerOpen(true);
                    return;
                  }
                  setIsWizardOpen(true);
                }}
                className="bg-gradient-to-r from-teal-400 to-emerald-500 hover:from-teal-500 hover:to-emerald-600 text-teal-950 font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-teal-400/20 transition-all px-5 h-11 border-0"
              >
                <Plus size={20} className="stroke-[3px]" />
                Buat RPS Baru
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      {isTeacher && totalRps > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-6 bg-white border border-teal-50 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Layers size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Rencana Semester</p>
              <p className="text-2xl font-black text-teal-950 mt-1">{totalRps} RPS</p>
            </div>
          </Card>
          
          <Card className="p-6 bg-white border border-emerald-50 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Terpublikasi ke Siswa</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{publishedRps} Aktif</p>
            </div>
          </Card>

          <Card className="p-6 bg-white border border-amber-50 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Calendar size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Draft / Belum Rilis</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{draftRps} Modul</p>
            </div>
          </Card>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="animate-spin text-teal-600" size={44} />
          <p className="text-muted-foreground animate-pulse text-sm">Memuat modul rencana pembelajaran...</p>
        </div>
      ) : error ? (
        <div className="flex items-center gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
          <ShieldAlert size={24} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <h4 className="font-bold text-red-900 text-sm">Terjadi Kesalahan</h4>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
          <Button onClick={fetchData} variant="secondary" size="sm" className="h-9 px-4">
            <RefreshCw size={14} className="mr-1.5" /> Muat Ulang
          </Button>
        </div>
      ) : rpsList.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed border-2 border-teal-100 bg-teal-50/5 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
          <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center text-teal-500 mb-6 shadow-inner">
            <ClipboardCheck size={38} />
          </div>
          <h3 className="text-xl font-bold text-teal-950 mb-2">Belum Ada RPS Terdaftar</h3>
          <p className="text-muted-foreground text-sm max-w-md mb-8 leading-relaxed">
            {isTeacher
              ? "Anda belum membuat rencana pembelajaran untuk semester ini. Silakan daftarkan mata pelajaran yang Anda ampu lalu klik 'Buat RPS Baru'."
              : "Belum ada rencana pembelajaran semester yang dipublikasikan oleh guru pengampu di kelas Anda."}
          </p>
          {isTeacher && (
            <div className="flex gap-4">
              <Button onClick={() => setIsSubjectManagerOpen(true)} variant="secondary" className="rounded-xl px-5 h-11">
                Atur Mapel
              </Button>
              <Button
                onClick={() => {
                  if (mySubjects.length === 0) {
                    toast.error("Silakan daftarkan mata pelajaran yang Anda ampu terlebih dahulu.");
                    setIsSubjectManagerOpen(true);
                    return;
                  }
                  setIsWizardOpen(true);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-5 h-11"
              >
                Buat RPS Sekarang
              </Button>
            </div>
          )}
        </Card>
      ) : (
        /* RPS List Grid */
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-teal-50 pb-3">
            <h2 className="font-extrabold text-teal-950 flex items-center gap-2">
              <BookOpen size={20} className="text-teal-600" />
              Daftar Rencana Aktif
            </h2>
            <span className="text-xs font-semibold text-muted-foreground bg-gray-50 border border-gray-100 rounded-full px-3 py-1">
              Menampilkan {rpsList.length} rencana
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rpsList.map((rps) => {
              const statusColors = {
                draft: "bg-amber-50 text-amber-700 border-amber-100",
                published: "bg-emerald-50 text-emerald-700 border-emerald-100",
                archived: "bg-gray-100 text-gray-700 border-gray-200"
              };

              return (
                <Card
                  key={rps.id}
                  className="bg-white border border-teal-100/50 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-300 transition-all duration-300 flex flex-col group relative overflow-hidden"
                >
                  {/* Status Tag */}
                  <div className="absolute right-4 top-4 z-10">
                    <Badge variant="neutral" className={`capitalize rounded-full font-bold px-2.5 py-0.5 text-[10px] ${statusColors[rps.status as keyof typeof statusColors]}`}>
                      {rps.status}
                    </Badge>
                  </div>

                  <div className="p-6 flex-1 flex flex-col space-y-4">
                    {/* Header */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest block">
                        {rps.academicYear?.name || "Tahun Ajaran"} • {rps.academicYear?.semester === "odd" ? "Ganjil" : "Genap"}
                      </span>
                      <h3 className="text-lg font-bold text-teal-950 line-clamp-1 group-hover:text-teal-600 transition-colors pr-16">
                        {rps.subject?.name || "Mata Pelajaran"}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Layers size={13} className="text-teal-500" />
                        <span>Kelas: <strong className="text-teal-900 font-semibold">{rps.class?.name || "Semua Kelas"}</strong></span>
                        <span className="mx-1">•</span>
                        <span>{rps.totalMeetings || 16} Pertemuan</span>
                      </div>
                    </div>

                    {/* Nomor Induk (MOD / ATP) */}
                    <div className="bg-teal-50/30 border border-teal-100/40 rounded-xl p-3 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-light">No RPS:</span>
                        <span className="font-mono text-teal-950 font-bold">{rps.nomorInduk1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-light">No Modul:</span>
                        <span className="font-mono text-teal-950 font-bold">{rps.nomorInduk2}</span>
                      </div>
                    </div>

                    {/* Objective preview */}
                    {rps.learningObjective && (
                      <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed italic bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                        "{rps.learningObjective}"
                      </p>
                    )}

                    {/* Student teacher label */}
                    {!isTeacher && rps.teacher && (
                      <div className="flex items-center gap-2 border-t border-teal-50/70 pt-3">
                        <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700">
                          {rps.teacher.name.charAt(0)}
                        </div>
                        <span className="text-xs font-semibold text-teal-950 truncate">Guru: {rps.teacher.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="bg-teal-50/10 border-t border-teal-50 p-4 flex flex-wrap gap-2 items-center justify-between shrink-0">
                    <Link href={`/hub/rps/${rps.id}`} className="flex-1 min-w-[80px]">
                      <Button size="sm" className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-1 px-3">
                        <Eye size={13} />
                        Kelola
                      </Button>
                    </Link>

                    {isTeacher && (
                      <div className="flex items-center gap-1">
                        {rps.status === "draft" && (
                          <Button
                            onClick={() => handlePublishRps(rps.id)}
                            disabled={actionLoading === `publish-${rps.id}`}
                            variant="secondary"
                            size="sm"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-[11px] font-semibold px-2.5 h-8"
                          >
                            {actionLoading === `publish-${rps.id}` ? <Loader2 className="animate-spin h-3 w-3" /> : "Publish"}
                          </Button>
                        )}

                        {rps.status === "published" && (
                          <Button
                            onClick={() => handleArchiveRps(rps.id)}
                            disabled={actionLoading === `archive-${rps.id}`}
                            variant="secondary"
                            size="sm"
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-[11px] font-semibold px-2.5 h-8"
                          >
                            Archive
                          </Button>
                        )}

                        {/* Excel Tools Dropdown-like Buttons */}
                        <Button
                          onClick={() => {
                            setSelectedRpsIdForImport(rps.id);
                            setIsImportModalOpen(true);
                          }}
                          variant="secondary"
                          size="sm"
                          title="Import data pertemuan dari Excel"
                          className="h-8 w-8 p-0 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600"
                        >
                          <Upload size={13} />
                        </Button>

                        <Button
                          onClick={() => handleExportBundle(rps.id, rps.subject.name)}
                          variant="secondary"
                          size="sm"
                          title="Download bundle RPS JSON"
                          className="h-8 w-8 p-0 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-xl text-gray-600"
                        >
                          <FileJson size={13} />
                        </Button>

                        <Button
                          onClick={() => handleDeleteRps(rps.id)}
                          disabled={actionLoading === `delete-${rps.id}`}
                          variant="secondary"
                          size="sm"
                          title="Hapus RPS permanen"
                          className="h-8 w-8 p-0 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl"
                        >
                          {actionLoading === `delete-${rps.id}` ? <Loader2 className="animate-spin" size={13} /> : <Trash2 size={13} />}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Quick Helper Banner for Teachers */}
          {isTeacher && (
            <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100/55 rounded-2xl p-5 mt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-teal-600 text-white rounded-xl flex items-center justify-center shadow-md">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-teal-950 text-sm">Alat Kelola Massal via Excel</h4>
                  <p className="text-xs text-muted-foreground">Download template standar RPS Maleo, isi rencana pertemuan, lalu unggah kembali.</p>
                </div>
              </div>
              <Button
                onClick={handleDownloadExcelTemplate}
                className="bg-white hover:bg-teal-50 border border-teal-200 text-teal-700 text-xs font-bold rounded-xl flex items-center gap-2 h-9 px-4 shrink-0 shadow-sm"
              >
                <Download size={14} /> Download Template Excel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────
          MODAL 1: SUBJECT MANAGER (Mata Pelajaran Guru)
          ────────────────────────────────────────────── */}
      <Modal isOpen={isSubjectManagerOpen} onClose={() => setIsSubjectManagerOpen(false)} title="Mata Pelajaran Anda (Max 2)">
        <div className="p-6 space-y-6">
          <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-teal-900 uppercase tracking-widest flex items-center gap-1.5">
              <UserCheck size={14} className="text-teal-600" />
              Sistem Pembatasan Guru
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guru di SIAKAD Maleo dibatasi mengampu maksimal <strong>2 mata pelajaran</strong> secara bersamaan. Pendaftaran ini dibutuhkan agar Anda dapat men-generate rencana RPS.
            </p>
          </div>

          {/* Bind Subject Form */}
          {mySubjects.length < 2 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-teal-950">Tambahkan Mapel Ampu</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select
                    id="selectedSubjectToBind"
                    name="selectedSubjectToBind"
                    placeholder="Pilih Mata Pelajaran"
                    value={selectedSubjectToBind}
                    onChange={(e) => setSelectedSubjectToBind(e.target.value)}
                    options={allSubjects
                      .filter(s => !mySubjects.some(ms => ms.id === s.id))
                      .map(s => ({ value: s.id.toString(), label: `[Grade ${s.gradeLevel}] ${s.name} (${s.code})` }))}
                  />
                </div>
                <Button
                  onClick={handleBindSubject}
                  disabled={actionLoading === "bind-subject"}
                  className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4 shrink-0 font-bold text-sm h-[42px]"
                >
                  {actionLoading === "bind-subject" ? <Loader2 className="animate-spin h-4 w-4" /> : "Tambahkan"}
                </Button>
              </div>
            </div>
          )}

          {/* List Current Binded Subjects */}
          <div className="space-y-3">
            <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider">Mapel Yang Sedang Diamampu</h4>
            <div className="divide-y divide-teal-50 border border-teal-50 rounded-2xl overflow-hidden bg-white">
              {mySubjects.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground italic">
                  Belum ada mata pelajaran yang didaftarkan.
                </div>
              ) : (
                mySubjects.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 group hover:bg-teal-50/10">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center text-xs font-bold">
                        {sub.code.substring(0, 3)}
                      </div>
                      <div>
                        <h5 className="font-bold text-teal-950 text-sm">{sub.name}</h5>
                        <p className="text-[10px] text-muted-foreground">Kode: {sub.code} • Tingkat: Kelas {sub.gradeLevel}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnbindSubject(sub.id)}
                      disabled={actionLoading === `unbind-${sub.id}`}
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Lepas Mapel"
                    >
                      {actionLoading === `unbind-${sub.id}` ? <Loader2 className="animate-spin h-3 w-3" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-teal-50">
            <Button onClick={() => setIsSubjectManagerOpen(false)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
              Selesai
            </Button>
          </div>
        </div>
      </Modal>

      {/* ──────────────────────────────────────────────
          MODAL 2: SETUP WIZARD (Generate RPS)
          ────────────────────────────────────────────── */}
      <Modal isOpen={isWizardOpen} onClose={() => !actionLoading && setIsWizardOpen(false)} title="Wizard Pembuatan RPS Baru">
        <div className="p-6 space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-6 w-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shadow-md shadow-teal-500/20">
                {wizardStep}
              </span>
              <span className="text-xs font-bold text-teal-950">Langkah {wizardStep} dari 6</span>
            </div>
            <div className="h-1.5 w-32 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${(wizardStep / 6) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* STEP 1: Academic Year */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Tahun Ajaran & Semester</h3>
                <p className="text-xs text-muted-foreground">Pilih periode aktif untuk pembuatan RPS ini.</p>
              </div>
              <Select
                id="wizardYear"
                name="wizardYear"
                placeholder="Pilih Tahun Ajaran"
                value={wizardForm.academicYearId}
                onChange={(e) => setWizardForm({ ...wizardForm, academicYearId: e.target.value })}
                options={academicYears.map(y => ({
                  value: y.id.toString(),
                  label: `${y.name} - Semester ${y.semester === "odd" ? "Ganjil" : "Genap"} ${y.isActive ? "(Aktif)" : ""}`
                }))}
              />
            </div>
          )}

          {/* STEP 2: Subject */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Pilih Mata Pelajaran</h3>
                <p className="text-xs text-muted-foreground">Mata pelajaran yang Anda ampu yang akan dibuatkan RPS.</p>
              </div>
              <Select
                id="wizardSubject"
                name="wizardSubject"
                placeholder="Pilih Mata Pelajaran"
                value={wizardForm.subjectId}
                onChange={(e) => setWizardForm({ ...wizardForm, subjectId: e.target.value })}
                options={mySubjects.map(s => ({
                  value: s.id.toString(),
                  label: `[Tingkat ${s.gradeLevel}] ${s.name} (${s.code})`
                }))}
              />
              {mySubjects.length === 0 && (
                <p className="text-xs text-red-500 italic">Belum ada mapel ampu. Hubungkan dulu di tombol atur mapel.</p>
              )}
            </div>
          )}

          {/* STEP 3: Class */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Target Kelas</h3>
                <p className="text-xs text-muted-foreground">Pilih kelas yang akan dikaitkan dengan rencana ini.</p>
              </div>
              <Select
                id="wizardClass"
                name="wizardClass"
                placeholder="Pilih Kelas"
                value={wizardForm.classId}
                onChange={(e) => setWizardForm({ ...wizardForm, classId: e.target.value })}
                options={classes.map(c => ({
                  value: c.id.toString(),
                  label: `Kelas ${c.name} (Tingkat ${c.level})`
                }))}
              />
            </div>
          )}

          {/* STEP 4: Meetings count */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Jumlah Pertemuan</h3>
                <p className="text-xs text-muted-foreground">Jumlah tatap muka dalam semester (Standar: 16 pertemuan termasuk UTS & UAS).</p>
              </div>
              <Input
                id="wizardMeetings"
                name="wizardMeetings"
                type="number"
                min={1}
                max={52}
                value={wizardForm.totalMeetings}
                onChange={(e) => setWizardForm({ ...wizardForm, totalMeetings: Number(e.target.value) })}
              />
            </div>
          )}

          {/* STEP 5: Detail & Rincian */}
          {wizardStep === 5 && (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Rincian Tambahan</h3>
                <p className="text-xs text-muted-foreground">Tuliskan ringkasan alur, strategi, dan catatan kurikulum Merdeka.</p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-bold text-teal-950">Tujuan Capaian Pembelajaran (CP / ATP)</label>
                <textarea
                  className="w-full rounded-xl border border-teal-100 p-3 text-xs focus:ring-2 focus:ring-teal-500 transition-all"
                  rows={3}
                  placeholder="Contoh: Siswa mampu memecahkan persamaan linear satu variabel..."
                  value={wizardForm.learningObjective}
                  onChange={(e) => setWizardForm({ ...wizardForm, learningObjective: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-teal-950">Strategi Pembelajaran Semester</label>
                <textarea
                  className="w-full rounded-xl border border-teal-100 p-3 text-xs focus:ring-2 focus:ring-teal-500 transition-all"
                  rows={3}
                  placeholder="Contoh: Diskusi aktif, Flipped Classroom, Eksplorasi Geogebra..."
                  value={wizardForm.learningStrategy}
                  onChange={(e) => setWizardForm({ ...wizardForm, learningStrategy: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-teal-950">Catatan Khusus Pengajar</label>
                <textarea
                  className="w-full rounded-xl border border-teal-100 p-3 text-xs focus:ring-2 focus:ring-teal-500 transition-all"
                  rows={2}
                  placeholder="Contoh: Memerlukan ruang lab komputer untuk pertemuan 8..."
                  value={wizardForm.teacherNote}
                  onChange={(e) => setWizardForm({ ...wizardForm, teacherNote: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation */}
          {wizardStep === 6 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-extrabold text-teal-950 text-base">Konfirmasi Akhir</h3>
                <p className="text-xs text-muted-foreground">Periksa rincian data sebelum memproses auto-generate.</p>
              </div>

              <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tahun Ajaran:</span>
                  <span className="font-bold text-teal-950">
                    {academicYears.find(y => y.id.toString() === wizardForm.academicYearId)?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semester:</span>
                  <span className="font-bold text-teal-950">
                    {academicYears.find(y => y.id.toString() === wizardForm.academicYearId)?.semester === "odd" ? "Ganjil" : "Genap"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mata Pelajaran:</span>
                  <span className="font-bold text-teal-950">
                    {mySubjects.find(s => s.id.toString() === wizardForm.subjectId)?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target Kelas:</span>
                  <span className="font-bold text-teal-950">
                    {classes.find(c => c.id.toString() === wizardForm.classId)?.name || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Pertemuan:</span>
                  <span className="font-bold text-teal-700">{wizardForm.totalMeetings} Sesi (Auto-generated)</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-800">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <p>Auto-generate akan otomatis membuat data {wizardForm.totalMeetings} pertemuan kosong di dalam database yang bisa Anda isi bertahap atau di-import sekaligus via Excel.</p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-teal-50">
            {wizardStep > 1 ? (
              <Button variant="secondary" onClick={handlePrevStep} disabled={!!actionLoading} className="rounded-xl flex items-center gap-1">
                <ArrowLeft size={16} /> Kembali
              </Button>
            ) : (
              <Button variant="secondary" onClick={() => setIsWizardOpen(false)} disabled={!!actionLoading} className="rounded-xl">
                Batal
              </Button>
            )}

            {wizardStep < 6 ? (
              <Button onClick={handleNextStep} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center gap-1">
                Lanjut <ArrowRight size={16} />
              </Button>
            ) : (
              <Button
                onClick={handleGenerateRps}
                disabled={actionLoading === "generate-rps"}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl px-6 font-bold shadow-lg shadow-teal-500/20"
              >
                {actionLoading === "generate-rps" ? <Loader2 className="animate-spin mr-1.5 h-4 w-4" /> : "Proses Generate"}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ──────────────────────────────────────────────
          MODAL 3: IMPORT EXCEL
          ────────────────────────────────────────────── */}
      <Modal isOpen={isImportModalOpen} onClose={() => !actionLoading && setIsImportModalOpen(false)} title="Import Data Sesi Pertemuan">
        <div className="p-6 space-y-6">
          <div className="bg-teal-50/50 border border-teal-100/50 rounded-2xl p-4 flex gap-3 text-xs text-teal-900 leading-relaxed">
            <FileSpreadsheet size={20} className="text-teal-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-teal-950">Gunakan Template Standar</h5>
              <p className="text-muted-foreground mt-0.5">
                Pastikan Anda menggunakan file Excel template yang diunduh dari tombol template standar. Jangan mengubah susunan kolom ("No Pertemuan", "Judul Pertemuan", "Alur Pembelajaran", "Tujuan Pembelajaran", "Aktivitas", "Penilaian").
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-teal-100 hover:border-teal-300 rounded-2xl p-8 text-center bg-gray-50/50 relative cursor-pointer group transition-all duration-300">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="import-excel-file"
            />
            <div className="space-y-2">
              <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-sm">
                <Upload size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-teal-950">
                  {importFile ? importFile.name : "Klik atau seret file Excel di sini"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "Maksimal ukuran file 10MB (.xlsx, .xls)"}
                </p>
              </div>
            </div>
          </div>

          {importFile && (
            <div className="flex items-center justify-between bg-teal-50 border border-teal-100/60 rounded-xl p-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-teal-600 shrink-0" />
                <span className="font-medium text-teal-900 truncate max-w-[200px]">{importFile.name}</span>
              </div>
              <button
                onClick={() => setImportFile(null)}
                className="text-muted-foreground hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-teal-50">
            <Button
              variant="secondary"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
                setSelectedRpsIdForImport(null);
              }}
              disabled={!!actionLoading}
              className="rounded-xl"
            >
              Batal
            </Button>
            <Button
              onClick={handleImportExcel}
              disabled={actionLoading === "import-excel" || !importFile}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold px-5"
            >
              {actionLoading === "import-excel" ? <Loader2 className="animate-spin mr-1.5 h-4 w-4" /> : "Unggah & Proses"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
