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
  ExternalLink
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/apiService";

type SelectionType = 'none' | 'module' | 'session' | 'material';

interface SelectedItem {
  type: SelectionType;
  id: number | null;
  data?: any;
}

// Data Dummy Tahun Ajaran
const DUMMY_ACADEMIC_YEARS = [
  { id: 1, name: '2025/2026', semester: 'Ganjil', isActive: true },
  { id: 2, name: '2025/2026', semester: 'Genap', isActive: false }
];

export default function MaterialsPage() {
  // Data Dummy Semester GANJIL (di dalam komponen untuk isolasi)
  const DUMMY_DATA_GANJIL = [
    {
      id: 1,
      title: 'Modul 1 - Bilangan Bulat',
      description: 'Pengenalan bilangan bulat dan operasi dasar seperti penjumlahan, pengurangan, perkalian dan pembagian',
      sessions: [
        {
          id: 1,
          title: 'Pertemuan 1 - Pengertian Bilangan',
          sessionNumber: 1,
          isRepeatable: false,
          materials: [
            { id: 1, title: 'PPT Pengenalan Bilangan.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt1.pdf' },
            { id: 2, title: 'Video Intro Bilangan Bulat', type: 'video', fileUrl: 'https://example.com/video1' }
          ]
        },
        {
          id: 2,
          title: 'Pertemuan 2 - Operasi Penjumlahan dan Pengurangan',
          sessionNumber: 2,
          isRepeatable: false,
          materials: [
            { id: 3, title: 'Slide Operasi Dasar.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt2.pdf' },
            { id: 4, title: 'Contoh Soal Penjumlahan.pdf', type: 'pdf', fileUrl: 'https://example.com/pdf1.pdf' }
          ]
        },
        {
          id: 3,
          title: 'Pertemuan 3 - Operasi Perkalian dan Pembagian',
          sessionNumber: 3,
          isRepeatable: false,
          materials: [
            { id: 5, title: 'Tutorial Perkalian.mp4', type: 'video', fileUrl: 'https://example.com/video2' }
          ]
        }
      ]
    },
    {
      id: 2,
      title: 'Modul 2 - Pecahan',
      description: 'Mempelajari pecahan, operasi pecahan, dan cara menyederhanakan pecahan',
      sessions: [
        {
          id: 4,
          title: 'Pertemuan 1 - Pengenalan Pecahan',
          sessionNumber: 1,
          isRepeatable: false,
          materials: [
            { id: 6, title: 'Materi Pecahan Dasar.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt3.pdf' },
            { id: 7, title: 'Video Konsep Pecahan', type: 'video', fileUrl: 'https://example.com/video3' },
            { id: 8, title: 'Latihan Soal Pecahan.pdf', type: 'pdf', fileUrl: 'https://example.com/pdf2.pdf' }
          ]
        },
        {
          id: 5,
          title: 'Pertemuan 2 - Operasi Pecahan (Penjumlahan)',
          sessionNumber: 2,
          isRepeatable: false,
          materials: [
            { id: 9, title: 'Penjumlahan Pecahan.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt4.pdf' },
            { id: 10, title: 'Contoh Soal Lengkap.pdf', type: 'pdf', fileUrl: 'https://example.com/pdf3.pdf' }
          ]
        },
        {
          id: 6,
          title: 'Pertemuan 3 - Operasi Pecahan (Pengurangan)',
          sessionNumber: 3,
          isRepeatable: false,
          materials: [
            { id: 11, title: 'Video Pengurangan Pecahan', type: 'video', fileUrl: 'https://example.com/video4' }
          ]
        },
        {
          id: 7,
          title: 'Pertemuan 4 - Menyederhanakan Pecahan',
          sessionNumber: 4,
          isRepeatable: true,
          materials: [
            { id: 12, title: 'Materi Penyederhanaan.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt5.pdf' },
            { id: 13, title: 'Kalkulator Pecahan Online', type: 'video', fileUrl: 'https://example.com/video5' }
          ]
        }
      ]
    },
    {
      id: 3,
      title: 'Modul 3 - Persamaan Linear',
      description: 'Memahami konsep persamaan linear satu variabel dan cara menyelesaikannya',
      sessions: [
        {
          id: 8,
          title: 'Pertemuan 1 - Pengertian Persamaan Linear',
          sessionNumber: 1,
          isRepeatable: false,
          materials: [
            { id: 14, title: 'Intro Persamaan Linear.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt6.pdf' },
            { id: 15, title: 'Apa itu Variabel?.mp4', type: 'video', fileUrl: 'https://example.com/video6' }
          ]
        },
        {
          id: 9,
          title: 'Pertemuan 2 - Menyelesaikan Persamaan Linear Sederhana',
          sessionNumber: 2,
          isRepeatable: false,
          materials: [
            { id: 16, title: 'Metode Penyelesaian.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt7.pdf' },
            { id: 17, title: 'Contoh Soal dan Pembahasan.pdf', type: 'pdf', fileUrl: 'https://example.com/pdf4.pdf' },
            { id: 18, title: 'Tutorial Langkah demi Langkah', type: 'video', fileUrl: 'https://example.com/video7' }
          ]
        },
        {
          id: 10,
          title: 'Pertemuan 3 - Persamaan Linear Kompleks',
          sessionNumber: 3,
          isRepeatable: false,
          materials: [
            { id: 19, title: 'Materi Lanjutan.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt8.pdf' },
            { id: 20, title: 'Bank Soal Persamaan Linear', type: 'pdf', fileUrl: 'https://example.com/pdf5.pdf' }
          ]
        },
        {
          id: 11,
          title: 'Pertemuan 4 - Penerapan Persamaan Linear',
          sessionNumber: 4,
          isRepeatable: true,
          materials: [
            { id: 21, title: 'Aplikasi Real World.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt9.pdf' },
            { id: 22, title: 'Studi Kasus dan Solusi', type: 'video', fileUrl: 'https://example.com/video8' }
          ]
        },
        {
          id: 12,
          title: 'Pertemuan 5 - Persamaan Linear Dua Variabel',
          sessionNumber: 5,
          isRepeatable: false,
          materials: [
            { id: 23, title: 'PLDV - Dasar.pptx', type: 'ppt', fileUrl: 'https://example.com/ppt10.pdf' },
            { id: 24, title: 'Metode Substitusi & Eliminasi', type: 'video', fileUrl: 'https://example.com/video9' }
          ]
        }
      ]
    }
  ];

  // Data Dummy Semester GENAP (di dalam komponen untuk isolasi)
  const DUMMY_DATA_GENAP = JSON.parse(JSON.stringify(DUMMY_DATA_GANJIL));

  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>(() => JSON.parse(JSON.stringify(DUMMY_DATA_GANJIL)));


  // State untuk menyimpan modules terpisah per semester dengan deep copy
  const [modulesGanjil, setModulesGanjil] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(DUMMY_DATA_GANJIL))
  );
    const [modulesGenap, setModulesGenap] = useState<any[]>(() =>
    JSON.parse(JSON.stringify(DUMMY_DATA_GENAP))
  );

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
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
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [sessionForm, setSessionForm] = useState({ title: "", sessionNumber: "", isRepeatable: false });
  const [materialForm, setMaterialForm] = useState({ title: "", type: "pdf", fileUrl: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const fetchFilters = async () => {
      try {
        setLoading(true);
        setError("");
        const [subsRes] = await Promise.all([
          apiService.getAll("/subjects")
        ]);
        setSubjects(subsRes.data);
        setAcademicYears(DUMMY_ACADEMIC_YEARS);

        const activeYear = DUMMY_ACADEMIC_YEARS.find((y: any) => y.isActive);
        if (activeYear) setSelectedYear(activeYear.id.toString());
        if (subsRes.data.length > 0) setSelectedSubject(subsRes.data[0].id.toString());
      } catch (error) {
        console.error(error);
        setAcademicYears(DUMMY_ACADEMIC_YEARS);
        const activeYear = DUMMY_ACADEMIC_YEARS.find((y: any) => y.isActive);
        if (activeYear) setSelectedYear(activeYear.id.toString());
        setError("Gagal memuat data. Menggunakan data contoh.");
      } finally {
        setLoading(false);
      }
    };
    fetchFilters();
  }, []);

  const fetchModules = async () => {
    if (!selectedSubject || !selectedYear) return;
    setLoading(true);
    setError("");
    try {
      // Return modul berdasarkan tahun ajaran
      if (selectedYear === '1') {
        setModules([...modulesGanjil]);
      } else if (selectedYear === '2') {
        setModules([...modulesGenap]);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error(error);
      setError("Gagal memuat modul. Menggunakan data contoh.");
      setModules(selectedYear === '1' ? [...modulesGanjil] : [...modulesGenap]);
    } finally {
      setLoading(false);
    }
  };

  // Sync displayed modules whenever semester state changes
  useEffect(() => {
    if (selectedYear === '1') {
      setModules([...modulesGanjil]);
    } else if (selectedYear === '2') {
      setModules([...modulesGenap]);
    }
  }, [modulesGanjil, modulesGenap, selectedYear]);

  useEffect(() => {
    fetchModules();
    // Reset UI state ketika semester berubah
    setExpandedModules([]);
    setExpandedSessions([]);
    selectItem('none', null);
  }, [selectedSubject, selectedYear]);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

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
    if (!moduleForm.title) return;
    setIsSubmitting(true);
    try {
      const newModule = {
        id: Math.max(...modules.map(m => m.id), 0) + 1,
        ...moduleForm,
        sessions: []
      };
      const updatedModules = [...modules, newModule];
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }
      
      setIsModuleModalOpen(false);
      setModuleForm({ title: "", description: "" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan modul.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSession = async () => {
    if (!sessionForm.title || !currentModuleId) return;
    setIsSubmitting(true);
    try {
      const newSession = {
        id: Math.max(...modules.flatMap(m => m.sessions).map((s: any) => s.id), 0) + 1,
        ...sessionForm,
        sessionNumber: sessionForm.sessionNumber ? Number(sessionForm.sessionNumber) : undefined,
        materials: []
      };
      const updatedModules = modules.map(m => m.id === currentModuleId ? { ...m, sessions: [...m.sessions, newSession] } : m);
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }
      
      setIsSessionModalOpen(false);
      setSessionForm({ title: "", sessionNumber: "", isRepeatable: false });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan sesi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMaterial = async () => {
    if (!materialForm.title || !materialForm.fileUrl || !currentSessionId) return;
    setIsSubmitting(true);
    try {
      const newMaterial = {
        id: Math.max(...modules.flatMap(m => m.sessions).flatMap((s: any) => s.materials).map((mt: any) => mt.id), 0) + 1,
        ...materialForm
      };
      const updatedModules = modules.map(m => ({
        ...m,
        sessions: m.sessions.map((s: any) => s.id === currentSessionId ? { ...s, materials: [...s.materials, newMaterial] } : s)
      }));
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }
      
      setIsMaterialModalOpen(false);
      setMaterialForm({ title: "", type: "pdf", fileUrl: "" });
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan materi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditModule = (moduleId: number) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      setModuleForm({ title: module.title, description: module.description || "" });
      setCurrentModuleId(moduleId);
      setIsModuleModalOpen(true);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (!confirm("Padam modul ini?")) return;
    try {
      const updatedModules = modules.filter(m => m.id !== id);
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }

      selectItem('none', null);
    } catch (error) {
      alert("Gagal memadam modul.");
    }
  };

  const handleDeleteSession = async (id: number) => {
    if (!confirm("Padam pertemuan ini?")) return;
    try {
      const updatedModules = modules.map(m => ({
        ...m,
        sessions: m.sessions.filter((s: any) => s.id !== id)
      }));
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }

      selectItem('none', null);
    } catch (error) {
      alert("Gagal memadam pertemuan.");
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (!confirm("Padam materi ini?")) return;
    try {
      const updatedModules = modules.map(m => ({
        ...m,
        sessions: m.sessions.map((s: any) => ({
          ...s,
          materials: s.materials.filter((mt: any) => mt.id !== id)
        }))
      }));
      
      // Update state sesuai semester
      if (selectedYear === '1') {
        setModulesGanjil(updatedModules);
      } else if (selectedYear === '2') {
        setModulesGenap(updatedModules);
      }

      selectItem('none', null);
    } catch (error) {
      alert("Gagal memadam materi.");
    }
  };

  const handleAccessMaterial = (url: string) => {
    if (url && url !== "#") {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Materi Pembelajaran</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola modul dan materi pembelajaran</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            placeholder="Pilih Mata Pelajaran"
            options={subjects.map(s => ({ value: s.id.toString(), label: s.name }))}
            value={selectedSubject}
            onChange={e => setSelectedSubject(e.target.value)}
          />
          <Select
            placeholder="Pilih Semester"
            options={academicYears.map(y => ({ value: y.id.toString(), label: `${y.name} - ${y.semester}` }))}
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          />
          <Button variant="secondary" size="sm" onClick={fetchModules} disabled={loading}>
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
          <Loader2 className="animate-spin mb-2 text-indigo-600" size={32} />
          <p className="text-muted-foreground">Memuatkan kandungan...</p>
        </div>
      )}

      {/* 2 Panel Layout */}
      {!loading && (
        <div className="grid grid-cols-3 gap-6 min-h-screen">
          {/* Panel Kiri - Tree View */}
          <div className="col-span-1">
            <Card className="p-6 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-foreground">Daftar Modul</h2>
                {isTeacher && (
                  <Button size="sm" onClick={() => { setCurrentModuleId(null); setModuleForm({ title: "", description: "" }); setIsModuleModalOpen(true); }}>
                    <Plus size={16} />
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                {modules.length > 0 ? (
                  modules.map((mod) => (
                    <div key={mod.id}>
                      {/* Module Item */}
                      <div
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all group ${selectedItem.type === 'module' && selectedItem.id === mod.id
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'hover:bg-muted/50'
                          }`}
                        onClick={() => {
                          selectItem('module', mod.id, mod);
                          toggleModule(mod.id);
                        }}
                      >
                        {expandedModules.includes(mod.id) ?
                          <ChevronDown size={16} className="flex-shrink-0" /> :
                          <ChevronRight size={16} className="flex-shrink-0" />
                        }
                        <BookOpen size={16} className="flex-shrink-0" />
                        <span className="text-sm font-medium flex-1 truncate">{mod.title}</span>
                        {isTeacher && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); handleEditModule(mod.id); }} className="p-1 hover:text-indigo-600">
                              <Pencil size={14} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteModule(mod.id); }} className="p-1 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Sessions */}
                      {expandedModules.includes(mod.id) && mod.sessions?.length > 0 && (
                        <div className="pl-6 space-y-1">
                          {mod.sessions.map((session: any) => (
                            <div key={session.id}>
                              <div
                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all group ${selectedItem.type === 'session' && selectedItem.id === session.id
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : 'hover:bg-muted/50'
                                  }`}
                                onClick={() => {
                                  selectItem('session', session.id, session);
                                  toggleSession(session.id);
                                }}
                              >
                                {expandedSessions.includes(session.id) ?
                                  <ChevronDown size={14} className="flex-shrink-0" /> :
                                  <ChevronRight size={14} className="flex-shrink-0" />
                                }
                                <FileText size={14} className="flex-shrink-0" />
                                <span className="text-xs font-medium flex-1 truncate">{session.title}</span>
                                {isTeacher && (
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }} className="p-1 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>

                              {/* Materials */}
                              {expandedSessions.includes(session.id) && session.materials?.length > 0 && (
                                <div className="pl-6 space-y-1">
                                  {session.materials.map((material: any) => (
                                    <div
                                      key={material.id}
                                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all group ${selectedItem.type === 'material' && selectedItem.id === material.id
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'hover:bg-muted/50'
                                        }`}
                                      onClick={() => selectItem('material', material.id, material)}
                                    >
                                      {material.type === 'video' ? <Video size={12} /> : <FileIcon size={12} />}
                                      <span className="text-xs flex-1 truncate">{material.title}</span>
                                      {isTeacher && (
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMaterial(material.id); }} className="p-1 hover:text-red-600 opacity-0 group-hover:opacity-100">
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-4">Belum ada modul untuk semester ini</p>
                )}
              </div>
            </Card>
          </div>

          {/* Panel Kanan - Detail View */}
          <div className="col-span-2">
            {selectedItem.type === 'none' ? (
              <Card className="p-12 text-center">
                <BookOpen size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">Pilih Materi</h3>
                <p className="text-sm text-muted-foreground">Pilih modul, pertemuan, atau materi dari daftar di sebelah kiri untuk melihat detailnya</p>
              </Card>
            ) : selectedItem.type === 'module' ? (
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{selectedItem.data?.title}</h2>
                  <p className="text-muted-foreground">{selectedItem.data?.description || "Tidak ada deskripsi"}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100">
                    <p className="text-3xl font-bold text-indigo-600">{selectedItem.data?.sessions?.length || 0}</p>
                    <p className="text-xs text-indigo-700 font-medium mt-1">Pertemuan</p>
                  </div>
                </div>

                {isTeacher && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => { setCurrentModuleId(selectedItem.id); setIsSessionModalOpen(true); }}>
                      <Plus size={16} /> Tambah Pertemuan
                    </Button>
                  </div>
                )}
              </Card>
            ) : selectedItem.type === 'session' ? (
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{selectedItem.data?.title}</h2>
                  {selectedItem.data?.sessionNumber && (
                    <p className="text-sm text-muted-foreground">Pertemuan ke-{selectedItem.data.sessionNumber}</p>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-foreground mb-4">Materi Pembelajaran</h3>
                  <div className="space-y-3">
                    {selectedItem.data?.materials?.length > 0 ? (
                      selectedItem.data.materials.map((mat: any) => (
                        <div key={mat.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${mat.type === 'video' ? 'bg-rose-50 text-rose-500' : mat.type === 'ppt' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                              {mat.type === 'video' ? <Video size={20} /> : <FileIcon size={20} />}
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{mat.title}</p>
                              <p className="text-xs text-muted-foreground uppercase font-semibold">{mat.type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" onClick={() => handleAccessMaterial(mat.fileUrl)} variant="secondary">
                              <Eye size={16} /> Buka
                            </Button>
                            {isTeacher && (
                              <button onClick={() => handleDeleteMaterial(mat.id)} className="p-2 text-muted-foreground hover:text-red-600">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">Belum ada materi pembelajaran</p>
                    )}
                  </div>
                </div>

                {isTeacher && (
                  <div className="flex gap-2 pt-4">
                    <Button onClick={() => { setCurrentSessionId(selectedItem.id); setIsMaterialModalOpen(true); }}>
                      <Plus size={16} /> Tambah Materi
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-4">{selectedItem.data?.title}</h2>
                  <div className={`inline-flex items-center gap-2 p-3 rounded-lg ${selectedItem.data?.type === 'video' ? 'bg-rose-50' : selectedItem.data?.type === 'ppt' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                    {selectedItem.data?.type === 'video' ? <Video size={24} className="text-rose-500" /> : <FileIcon size={24} className="text-blue-500" />}
                    <p className="font-semibold text-foreground uppercase text-sm">{selectedItem.data?.type}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleAccessMaterial(selectedItem.data?.fileUrl)} size="lg">
                    <ExternalLink size={16} /> Buka File
                  </Button>
                  {isTeacher && selectedItem.id && (
                    <Button onClick={() => handleDeleteMaterial(selectedItem.id as number)} variant="danger" size="lg">
                      <Trash2 size={16} /> Hapus
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isTeacher && (
        <>
          {/* Modal Modul */}
          <Modal isOpen={isModuleModalOpen} onClose={() => !isSubmitting && setIsModuleModalOpen(false)} title="Tambah Modul Baharu">
            <div className="p-4 space-y-4">
              <Input
                label="Tajuk Modul"
                placeholder="Contoh: Pengenalan Algoritma"
                value={moduleForm.title}
                onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })}
              />
              <Input
                label="Deskripsi (Opsional)"
                placeholder="Ringkasan tentang apa yang akan dipelajari"
                value={moduleForm.description}
                onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModuleModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddModule} disabled={isSubmitting || !moduleForm.title}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Modul"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Pertemuan */}
          <Modal isOpen={isSessionModalOpen} onClose={() => !isSubmitting && setIsSessionModalOpen(false)} title="Tambah Pertemuan Baru">
            <div className="p-4 space-y-4">
              <Input
                label="Tajuk Pertemuan"
                placeholder="Contoh: Struktur Data Stack"
                value={sessionForm.title}
                onChange={e => setSessionForm({ ...sessionForm, title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="No. Pertemuan (Opsional)"
                  type="number"
                  placeholder="Auto"
                  value={sessionForm.sessionNumber}
                  onChange={e => setSessionForm({ ...sessionForm, sessionNumber: e.target.value })}
                />
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={sessionForm.isRepeatable}
                      onChange={e => setSessionForm({ ...sessionForm, isRepeatable: e.target.checked })}
                      className="rounded border-border text-indigo-600"
                    />
                    Dapat diulang (untuk sesi latihan atau review)
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddSession} disabled={isSubmitting || !sessionForm.title}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Pertemuan"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Materi */}
          <Modal isOpen={isMaterialModalOpen} onClose={() => !isSubmitting && setIsMaterialModalOpen(false)} title="Tambah Materi Pembelajaran">
            <div className="p-4 space-y-4">
              <Input
                label="Tajuk Materi"
                placeholder="Contoh: Slide Presentasi Stack"
                value={materialForm.title}
                onChange={e => setMaterialForm({ ...materialForm, title: e.target.value })}
              />
              <Select
                label="Jenis Materi"
                options={[
                  { value: "pdf", label: "PDF Document" },
                  { value: "ppt", label: "PowerPoint" },
                  { value: "video", label: "Video Tutorial" }
                ]}
                value={materialForm.type}
                onChange={e => setMaterialForm({ ...materialForm, type: e.target.value })}
              />
              <Input
                label="Pautan URL (File/Video)"
                placeholder="https://example.com/file.pdf"
                value={materialForm.fileUrl}
                onChange={e => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddMaterial} disabled={isSubmitting || !materialForm.title || !materialForm.fileUrl}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Materi"}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
