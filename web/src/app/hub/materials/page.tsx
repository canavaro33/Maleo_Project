"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Plus,
  ChevronRight,
  ChevronDown,
  Video,
  File as FileIcon,
  Trash2,
  Eye,
  Pencil,
  RefreshCcw,
  Loader2,
  AlertCircle,
  ExternalLink,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/apiService";
import api from "@/lib/axios";

type SelectionType = 'none' | 'module' | 'session' | 'material';

interface SelectedItem {
  type: SelectionType;
  id: number | null;
  data?: any;
}

export default function MaterialsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<SelectedItem>({ type: 'none', id: null });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<number[]>([]);

  // Modals state
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);

  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);

  // Form states
  const [moduleForm, setModuleForm] = useState({ title: "", description: "", order: 0 });
  const [sessionForm, setSessionForm] = useState({ title: "", sessionNumber: "", isRepeatable: false, isPublished: true });
  const [materialForm, setMaterialForm] = useState({ 
    title: "", 
    type: "pdf", 
    linkUrl: "",
    file: null as File | null,
    order: 0 
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchFilters = async () => {
      try {
        setLoading(true);
        console.log("DEBUG: Fetching filters for user:", user.id);
        
        const [subsRes, classesRes, yearsRes] = await Promise.all([
          apiService.getAll("/lms/subjects"),
          apiService.getAll("/lms/classes"),
          apiService.getAll("/academic-years")
        ]);

        console.log("DEBUG: Subjects:", subsRes.data?.length);
        console.log("DEBUG: Classes:", classesRes.data?.length);
        console.log("DEBUG: Years:", yearsRes.data?.length);

        setSubjects(subsRes.data || []);
        setTeacherClasses(classesRes.data || []);
        setAcademicYears(yearsRes.data || []);

        // Auto-select logic
        if (subsRes.data?.length === 1) {
          setSelectedSubject(subsRes.data[0].id.toString());
        }
        if (classesRes.data?.length === 1) {
          setSelectedClass(classesRes.data[0].id.toString());
        }

        const activeYear = (yearsRes.data || []).find((y: any) => y.isActive);
        if (activeYear) setSelectedYear(activeYear.id.toString());
        else if (yearsRes.data?.length > 0) setSelectedYear(yearsRes.data[0].id.toString());

      } catch (error: any) {
        console.error("FILTER ERROR:", error?.response?.data || error);
        setError("Gagal memuat filter data. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, [user?.id]); // Only refetch if the user ID changes

  const fetchModules = async () => {
    if (!selectedSubject || !selectedYear) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiService.getAll("/lms/modules", {
        subjectId: selectedSubject,
        academicYearId: selectedYear,
        classId: selectedClass || undefined
      });
      setModules(res.data || []);
    } catch (error) {
      console.error(error);
      setError("Gagal memuat modul pembelajaran.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubject && selectedYear) {
      fetchModules();
    }
  }, [selectedSubject, selectedYear, selectedClass]);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";
  const isGuardian = user?.role === "guardian";

  const toggleModule = (id: number) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
  };

  const toggleSession = (id: number) => {
    setExpandedSessions(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const selectItem = (type: SelectionType, id: number | null, data?: any) => {
    setSelectedItem({ type, id, data });
  };

  // Handlers
  const handleAddModule = async () => {
    console.log("DEBUG: Submit Form", { title: moduleForm.title, subjectId: selectedSubject, yearId: selectedYear });
    
    if (!moduleForm.title || !selectedSubject || !selectedYear) {
      alert("Mohon isi judul modul, pilih mata pelajaran, dan semester.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (currentModuleId) {
        await apiService.update("/lms/modules", currentModuleId, {
          ...moduleForm,
          order: Number(moduleForm.order)
        });
      } else {
        await apiService.create("/lms/modules", {
          ...moduleForm,
          subjectId: selectedSubject,
          academicYearId: selectedYear,
          classId: selectedClass || undefined,
          order: Number(moduleForm.order)
        });
      }
      fetchModules();
      setIsModuleModalOpen(false);
      setModuleForm({ title: "", description: "", order: 0 });
      setCurrentModuleId(null);
    } catch (error: any) {
      alert("Gagal menyimpan modul.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditModule = (mod: any) => {
    setModuleForm({ title: mod.title, description: mod.description || "", order: mod.order || 0 });
    setCurrentModuleId(mod.id);
    setIsModuleModalOpen(true);
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm("Hapus modul ini beserta semua pertemuan dan materinya?")) return;
    try {
      await apiService.remove("/lms/modules", id);
      fetchModules();
      selectItem('none', null);
    } catch (error) {
      alert("Gagal menghapus modul.");
    }
  };

  const handleAddSession = async () => {
    if (!sessionForm.title || !currentModuleId) return;
    setIsSubmitting(true);
    try {
      if (currentSessionId && selectedItem.type === 'session') {
        // This is an edit
        await apiService.update("/lms/sessions", currentSessionId, {
          ...sessionForm,
          sessionNumber: Number(sessionForm.sessionNumber)
        });
      } else {
        await apiService.create("/lms/sessions", {
          ...sessionForm,
          moduleId: currentModuleId,
          sessionNumber: sessionForm.sessionNumber ? Number(sessionForm.sessionNumber) : undefined
        });
      }
      fetchModules();
      setIsSessionModalOpen(false);
      setSessionForm({ title: "", sessionNumber: "", isRepeatable: false, isPublished: true });
      setCurrentSessionId(null);
    } catch (error: any) {
      alert("Gagal menyimpan sesi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSession = (session: any) => {
    setSessionForm({ 
      title: session.title, 
      sessionNumber: session.sessionNumber.toString(), 
      isRepeatable: session.isRepeatable, 
      isPublished: session.isPublished 
    });
    setCurrentSessionId(session.id);
    setIsSessionModalOpen(true);
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm("Hapus pertemuan ini beserta semua materinya?")) return;
    try {
      await apiService.remove("/lms/sessions", id);
      fetchModules();
      selectItem('none', null);
    } catch (error) {
      alert("Gagal menghapus sesi.");
    }
  };

  const handleAddMaterial = async () => {
    if (!materialForm.title || !currentSessionId) return;
    
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("sessionId", currentSessionId.toString());
      formData.append("title", materialForm.title);
      formData.append("type", materialForm.type);
      formData.append("order", materialForm.order.toString());

      if (materialForm.type === 'link') {
        formData.append("fileUrl", materialForm.linkUrl);
        // Special case for link: we use the same endpoint but it might need different handling if link doesn't upload a file
        // For simplicity, let's assume the backend handles both if we send a dummy file or just use a different endpoint
        // Actually, our backend uploadMaterialFile expects req.file.
        // Let's adjust backend or handle here.
        // I'll use a direct create for link.
        await apiService.create("/lms/materials/upload-link", {
           sessionId: currentSessionId,
           title: materialForm.title,
           type: 'link',
           fileUrl: materialForm.linkUrl,
           order: materialForm.order
        });
      } else {
        if (!materialForm.file) {
          alert("Pilih file untuk diunggah.");
          setIsSubmitting(false);
          return;
        }
        formData.append("file", materialForm.file);
        await api.post("/lms/materials/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      fetchModules();
      setIsMaterialModalOpen(false);
      setMaterialForm({ title: "", type: "pdf", linkUrl: "", file: null, order: 0 });
    } catch (error: any) {
      console.error(error);
      alert("Gagal mengunggah materi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Hapus materi ini?")) return;
    try {
      await apiService.remove("/lms/materials", id);
      fetchModules();
      selectItem('none', null);
    } catch (error) {
      alert("Gagal menghapus materi.");
    }
  };

  const handleAccessMaterial = async (material: any) => {
    if (isStudent) {
      try {
        await api.post(`/lms/materials/${material.id}/access`);
      } catch (e) {
        console.error("Failed to track access");
      }
    }

    const url = material.fileUrl.startsWith('http') 
      ? material.fileUrl 
      : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4000'}${material.fileUrl}`;
    
    window.open(url, "_blank");
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={20} />;
      case 'pdf': return <FileText size={20} />;
      case 'image': return <ImageIcon size={20} />;
      case 'link': return <LinkIcon size={20} />;
      default: return <FileIcon size={20} />;
    }
  };

  const getMaterialColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-rose-50 text-rose-500';
      case 'pdf': return 'bg-red-50 text-red-500';
      case 'ppt':
      case 'pptx': return 'bg-orange-50 text-orange-500';
      case 'doc':
      case 'docx': return 'bg-blue-50 text-blue-500';
      case 'image': return 'bg-emerald-50 text-emerald-500';
      case 'link': return 'bg-indigo-50 text-indigo-500';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materi Pembelajaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? "Kelola modul dan materi pembelajaran Anda" : 
             isStudent ? "Akses materi pembelajaran sesuai mata pelajaran" :
             "Pantau materi pembelajaran anak Anda"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-48">
            <Select
              id="selectedSubject"
              name="selectedSubject"
              placeholder="Pilih Mata Pelajaran"
              options={subjects.map(s => ({ value: s.id.toString(), label: s.name }))}
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              id="selectedYear"
              name="selectedYear"
              placeholder="Pilih Semester"
              options={academicYears.map(y => ({ value: y.id.toString(), label: `${y.name} - ${y.semester}` }))}
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            />
          </div>
          {isTeacher && (
            <div className="w-48">
              <Select
                id="selectedClass"
                name="selectedClass"
                placeholder="Pilih Kelas"
                options={teacherClasses.map(c => ({ value: c.id.toString(), label: c.name }))}
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
              />
            </div>
          )}
          <Button variant="secondary" size="icon" onClick={fetchModules} disabled={loading}>
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={20} className="text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={fetchModules}>Coba Lagi</Button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin mb-2 text-teal-600" size={40} />
          <p className="text-muted-foreground animate-pulse">Memuat materi...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Module Tree */}
          <div className="lg:col-span-4">
            <Card className="p-5 sticky top-24 max-h-[calc(100vh-160px)] overflow-y-auto border-teal-100/50 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-teal-900 flex items-center gap-2">
                  <BookOpen size={18} className="text-teal-600" />
                  Struktur Modul
                </h2>
                {isTeacher && (
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 h-8 w-8 p-0" onClick={() => { setCurrentModuleId(null); setIsModuleModalOpen(true); }}>
                    <Plus size={16} />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {modules.length > 0 ? (
                  modules.map((mod) => (
                    <div key={mod.id} className="border-l-2 border-teal-50 ml-1">
                      {/* Module Item */}
                      <div
                        className={`flex items-center gap-2 p-2 rounded-r-lg cursor-pointer transition-all group relative ${
                          selectedItem.type === 'module' && selectedItem.id === mod.id
                            ? 'bg-teal-50 text-teal-700 border-l-2 border-teal-500 -ml-[2px]'
                            : 'hover:bg-teal-50/50'
                        }`}
                        onClick={() => {
                          selectItem('module', mod.id, mod);
                          toggleModule(mod.id);
                        }}
                      >
                        <div className="text-teal-400">
                          {expandedModules.includes(mod.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </div>
                        <span className="text-sm font-semibold truncate flex-1">{mod.title}</span>
                        {!mod.isPublished && isTeacher && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">Draft</span>
                        )}
                      </div>

                      {/* Sessions */}
                      {expandedModules.includes(mod.id) && (
                        <div className="ml-4 mt-1 space-y-1">
                          {mod.sessions?.map((session: any) => (
                            <div key={session.id} className="border-l border-teal-100 pl-2">
                              <div
                                className={`flex items-center gap-2 p-1.5 rounded-r-md cursor-pointer transition-all group ${
                                  selectedItem.type === 'session' && selectedItem.id === session.id
                                    ? 'bg-emerald-50 text-emerald-700 border-l-2 border-emerald-500 -ml-[2px]'
                                    : 'hover:bg-emerald-50/30'
                                }`}
                                onClick={() => {
                                  selectItem('session', session.id, session);
                                  toggleSession(session.id);
                                }}
                              >
                                <div className="text-emerald-400">
                                  {expandedSessions.includes(session.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </div>
                                <span className="text-xs font-medium truncate flex-1">Sesi {session.sessionNumber}: {session.title}</span>
                              </div>

                              {/* Materials */}
                              {expandedSessions.includes(session.id) && (
                                <div className="ml-4 mt-1 space-y-1">
                                  {session.materials?.map((mat: any) => (
                                    <div
                                      key={mat.id}
                                      className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-[11px] transition-all ${
                                        selectedItem.type === 'material' && selectedItem.id === mat.id
                                          ? 'bg-indigo-50 text-indigo-700 font-medium'
                                          : 'text-muted-foreground hover:bg-indigo-50/30'
                                      }`}
                                      onClick={() => selectItem('material', mat.id, mat)}
                                    >
                                      {getMaterialIcon(mat.type)}
                                      <span className="truncate flex-1">{mat.title}</span>
                                    </div>
                                  ))}
                                  {session.materials?.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground italic pl-6 py-1">Belum ada materi</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                          {isTeacher && (
                            <button 
                              onClick={() => { setCurrentModuleId(mod.id); setIsSessionModalOpen(true); }}
                              className="flex items-center gap-1.5 text-[10px] text-teal-600 font-medium pl-6 py-2 hover:underline"
                            >
                              <Plus size={12} /> Tambah Pertemuan
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center">
                    <BookOpen size={32} className="mx-auto text-teal-100 mb-2" />
                    <p className="text-xs text-muted-foreground italic">Belum ada modul</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Panel: Detail Content */}
          <div className="lg:col-span-8">
            {selectedItem.type === 'none' ? (
              <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-teal-100 bg-teal-50/10">
                <div className="h-20 w-20 rounded-full bg-teal-50 flex items-center justify-center mb-6">
                  <BookOpen size={40} className="text-teal-400" />
                </div>
                <h3 className="text-xl font-bold text-teal-900 mb-2">Pilih Materi Pembelajaran</h3>
                <p className="text-muted-foreground max-w-sm">
                  Pilih salah satu modul atau pertemuan dari panel sebelah kiri untuk melihat rincian materi yang tersedia.
                </p>
              </Card>
            ) : selectedItem.type === 'module' ? (
              <Card className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-teal-100 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Modul Pembelajaran</span>
                      {selectedItem.data?.isPublished ? (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10} /> Terpublikasi</span>
                      ) : (
                        <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded">Draft</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-teal-900">{selectedItem.data?.title}</h2>
                    <p className="text-teal-600/70 font-medium mt-1">Mata Pelajaran: {selectedItem.data?.subject?.name}</p>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditModule(selectedItem.data)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteModule(selectedItem.data.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-100/50">
                  <h4 className="font-bold text-teal-900 mb-2">Deskripsi Modul</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {selectedItem.data?.description || "Tidak ada deskripsi untuk modul ini."}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Total Pertemuan</p>
                    <p className="text-3xl font-black text-teal-700">{selectedItem.data?.sessions?.length || 0}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white border border-teal-100 shadow-sm">
                    <p className="text-sm font-medium text-muted-foreground">Dibuat Oleh</p>
                    <p className="text-lg font-bold text-teal-900 truncate">{selectedItem.data?.teacher?.name}</p>
                  </div>
                </div>

                {isTeacher && (
                  <div className="pt-4 border-t border-teal-100">
                    <Button onClick={() => { setCurrentModuleId(selectedItem.id); setIsSessionModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 rounded-xl px-6">
                      <Plus size={18} className="mr-2" /> Tambah Pertemuan Baru
                    </Button>
                  </div>
                )}
              </Card>
            ) : selectedItem.type === 'session' ? (
              <Card className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Sesi Pertemuan {selectedItem.data?.sessionNumber}</span>
                      {selectedItem.data?.isRepeatable && (
                        <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Dapat Diulang</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-extrabold text-teal-900">{selectedItem.data?.title}</h2>
                  </div>
                  {isTeacher && (
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => handleEditSession(selectedItem.data)}>
                        <Pencil size={16} />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteSession(selectedItem.data.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-teal-900 text-lg flex items-center gap-2">
                      <FileText size={20} className="text-teal-600" />
                      Materi Pembelajaran
                    </h3>
                    {isTeacher && (
                      <Button size="sm" variant="secondary" onClick={() => { setCurrentSessionId(selectedItem.id); setIsMaterialModalOpen(true); }} className="text-teal-600 border-teal-200">
                        <Plus size={16} className="mr-1" /> Unggah Materi
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {selectedItem.data?.materials?.length > 0 ? (
                      selectedItem.data.materials.map((mat: any) => (
                        <div 
                          key={mat.id} 
                          className="group flex items-center justify-between p-4 bg-white border border-teal-100 rounded-2xl hover:shadow-md hover:border-teal-300 transition-all cursor-pointer"
                          onClick={() => handleAccessMaterial(mat)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${getMaterialColor(mat.type)}`}>
                              {getMaterialIcon(mat.type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-teal-900 group-hover:text-teal-600 transition-colors">{mat.title}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{mat.type}</span>
                                {isTeacher && mat._count?.access > 0 && (
                                  <span className="text-[10px] text-teal-600 font-medium">Diakses {mat._count.access} kali</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-all">
                              <Eye size={16} />
                            </div>
                            {isTeacher && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(mat.id); }} 
                                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-teal-50 rounded-2xl">
                        <FileText size={48} className="mx-auto text-teal-100 mb-3" />
                        <p className="text-muted-foreground">Belum ada materi pembelajaran yang diunggah untuk sesi ini.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 space-y-8 animate-in fade-in scale-in-95 duration-300">
                <div className="flex items-center gap-6">
                  <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-lg ${getMaterialColor(selectedItem.data?.type)}`}>
                    {getMaterialIcon(selectedItem.data?.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1 block">Pratinjau Materi</span>
                    <h2 className="text-3xl font-extrabold text-teal-900">{selectedItem.data?.title}</h2>
                  </div>
                </div>

                <div className="p-10 rounded-3xl bg-teal-50/50 border border-teal-100 flex flex-col items-center justify-center text-center">
                  <div className="mb-6">
                    {selectedItem.data?.type === 'video' ? <Video size={64} className="text-teal-200" /> : <FileText size={64} className="text-teal-200" />}
                  </div>
                  <h4 className="text-lg font-bold text-teal-900 mb-1">{selectedItem.data?.title}</h4>
                  <p className="text-sm text-muted-foreground mb-8">Tipe File: {selectedItem.data?.type.toUpperCase()}</p>
                  
                  <div className="flex gap-4">
                    <Button onClick={() => handleAccessMaterial(selectedItem.data)} className="bg-teal-600 hover:bg-teal-700 rounded-xl px-8 h-12 shadow-lg shadow-teal-600/20">
                      <ExternalLink size={18} className="mr-2" /> Buka Materi
                    </Button>
                    {isTeacher && (
                      <Button variant="danger" onClick={() => handleDeleteMaterial(selectedItem.id as number)} className="rounded-xl px-8 h-12">
                        <Trash2 size={18} className="mr-2" /> Hapus
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals Section */}
      {isTeacher && (
        <>
          {/* Modal Modul */}
          <Modal isOpen={isModuleModalOpen} onClose={() => !isSubmitting && setIsModuleModalOpen(false)} title="Tambah Modul Baru">
            <div className="p-6 space-y-5">
              <Input
                id="moduleTitle"
                name="moduleTitle"
                label="Judul Modul"
                placeholder="Contoh: Pengenalan Aljabar"
                value={moduleForm.title}
                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
              <div>
                <label htmlFor="moduleDescription" className="block text-sm font-bold text-teal-900 mb-2">Deskripsi Modul</label>
                <textarea
                  id="moduleDescription"
                  name="moduleDescription"
                  className="w-full rounded-xl border border-teal-100 p-3 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                  rows={4}
                  placeholder="Berikan ringkasan materi yang akan dipelajari..."
                  value={moduleForm.description}
                  onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
                ></textarea>
              </div>
              <Input
                id="moduleOrder"
                name="moduleOrder"
                label="Urutan"
                type="number"
                value={moduleForm.order}
                onChange={e => setModuleForm({ ...moduleForm, order: Number(e.target.value) })}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsModuleModalOpen(false)} disabled={isSubmitting} className="rounded-xl">Batal</Button>
                <Button onClick={handleAddModule} disabled={isSubmitting || !moduleForm.title || !selectedSubject || !selectedYear} className="bg-teal-600 hover:bg-teal-700 rounded-xl px-6">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan Modul"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Pertemuan */}
          <Modal isOpen={isSessionModalOpen} onClose={() => !isSubmitting && setIsSessionModalOpen(false)} title="Tambah Pertemuan">
            <div className="p-6 space-y-5">
              <Input
                id="sessionTitle"
                name="sessionTitle"
                label="Judul Pertemuan"
                placeholder="Contoh: Operasi Hitung Campuran"
                value={sessionForm.title}
                onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="sessionNumber"
                  name="sessionNumber"
                  label="Nomor Sesi"
                  type="number"
                  placeholder="Auto"
                  value={sessionForm.sessionNumber}
                  onChange={e => setSessionForm({ ...sessionForm, sessionNumber: e.target.value })}
                />
                <div className="flex flex-col justify-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      id="isRepeatable"
                      name="isRepeatable"
                      type="checkbox"
                      checked={sessionForm.isRepeatable}
                      onChange={e => setSessionForm({ ...sessionForm, isRepeatable: e.target.checked })}
                      className="rounded border-teal-200 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm font-medium text-teal-900 group-hover:text-teal-600">Dapat diulang</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)} disabled={isSubmitting} className="rounded-xl">Batal</Button>
                <Button onClick={handleAddSession} disabled={isSubmitting || !sessionForm.title} className="bg-teal-600 hover:bg-teal-700 rounded-xl px-6">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan Sesi"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Material */}
          <Modal isOpen={isMaterialModalOpen} onClose={() => !isSubmitting && setIsMaterialModalOpen(false)} title="Unggah Materi">
            <div className="p-6 space-y-5">
              <Input
                id="materialTitle"
                name="materialTitle"
                label="Judul Materi"
                placeholder="Contoh: Slide Presentasi Bilangan Bulat"
                value={materialForm.title}
                onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="materialType" className="block text-sm font-bold text-teal-900 mb-2">Tipe Materi</label>
                  <Select
                    id="materialType"
                    name="materialType"
                    options={[
                      { value: "pdf", label: "PDF Document" },
                      { value: "ppt", label: "PowerPoint" },
                      { value: "pptx", label: "PowerPoint (New)" },
                      { value: "doc", label: "Word Document" },
                      { value: "docx", label: "Word Document (New)" },
                      { value: "video", label: "Video (MP4)" },
                      { value: "image", label: "Gambar (JPG/PNG)" },
                      { value: "link", label: "Tautan Eksternal" },
                    ]}
                    value={materialForm.type}
                    onChange={e => setMaterialForm({ ...materialForm, type: e.target.value })}
                  />
                </div>
                <Input
                  id="materialOrder"
                  name="materialOrder"
                  label="Urutan Tampilan"
                  type="number"
                  value={materialForm.order}
                  onChange={e => setMaterialForm({ ...materialForm, order: Number(e.target.value) })}
                />
              </div>

              {materialForm.type === 'link' ? (
                <Input
                  id="linkUrl"
                  name="linkUrl"
                  label="URL Tautan"
                  placeholder="https://example.com/materi-ekstra"
                  value={materialForm.linkUrl}
                  onChange={e => setMaterialForm({ ...materialForm, linkUrl: e.target.value })}
                />
              ) : (
                <div>
                  <label className="block text-sm font-bold text-teal-900 mb-2">File Materi (Maks 20MB)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-teal-100 border-dashed rounded-2xl bg-teal-50/20 hover:bg-teal-50 transition-colors">
                    <div className="space-y-2 text-center">
                      <Upload size={32} className="mx-auto text-teal-400" />
                      <div className="flex text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-bold text-teal-600 hover:text-teal-500 focus-within:outline-none">
                          <span>Pilih file</span>
                          <input 
                            id="fileInput"
                            name="fileInput"
                            type="file" 
                            className="sr-only" 
                            onChange={e => setMaterialForm({ ...materialForm, file: e.target.files?.[0] || null })}
                            accept=".pdf,.ppt,.pptx,.doc,.docx,.mp4,.jpg,.jpeg,.png"
                          />
                        </label>
                        <p className="pl-1">atau tarik dan lepas</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {materialForm.file ? (
                          <span className="text-teal-600 font-bold">{materialForm.file.name}</span>
                        ) : (
                          "PDF, PPT, DOC, Video, atau Gambar"
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)} disabled={isSubmitting} className="rounded-xl">Batal</Button>
                <Button 
                  onClick={handleAddMaterial} 
                  disabled={isSubmitting || !materialForm.title || (materialForm.type === 'link' ? !materialForm.linkUrl : !materialForm.file)} 
                  className="bg-teal-600 hover:bg-teal-700 rounded-xl px-6"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan & Unggah"}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
