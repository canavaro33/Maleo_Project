"use client";

import React, { useState, useEffect } from "react";
import { 
  Folder, 
  FileText, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Video, 
  File as FileIcon, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCcw,
  Loader2,
  Edit3,
  BookOpen,
  CheckSquare,
  Square,
  ExternalLink,
  Lock,
  X
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/apiService";

export default function MaterialsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [user, setUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
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
        const [subsRes, yearsRes] = await Promise.all([
          apiService.getAll("/subjects"),
          apiService.getAll("/academic-years")
        ]);
        setSubjects(subsRes.data);
        setAcademicYears(yearsRes.data);
        
        const activeYear = yearsRes.data.find((y: any) => y.isActive);
        if (activeYear) setSelectedYear(activeYear.id.toString());
        if (subsRes.data.length > 0) setSelectedSubject(subsRes.data[0].id.toString());
      } catch (error) {
        console.error(error);
      }
    };
    fetchFilters();
  }, []);

  const fetchModules = async () => {
    if (!selectedSubject || !selectedYear) return;
    setLoading(true);
    try {
      const response = await apiService.getAll(`/hub/teacher/learning-modules?subjectId=${selectedSubject}&academicYearId=${selectedYear}`);
      setModules(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [selectedSubject, selectedYear]);

  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const toggleModule = (id: number) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]);
  };

  const toggleSession = (id: number) => {
    setExpandedSessions(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  // Handlers
  const handleAddModule = async () => {
    if (!moduleForm.title) return;
    setIsSubmitting(true);
    try {
      await apiService.create("/hub/teacher/learning-modules", {
        ...moduleForm,
        subjectId: selectedSubject,
        academicYearId: selectedYear
      });
      setIsModuleModalOpen(false);
      setModuleForm({ title: "", description: "" });
      fetchModules();
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
      await apiService.create(`/hub/teacher/learning-modules/${currentModuleId}/sessions`, {
        ...sessionForm,
        sessionNumber: sessionForm.sessionNumber ? Number(sessionForm.sessionNumber) : undefined
      });
      setIsSessionModalOpen(false);
      setSessionForm({ title: "", sessionNumber: "", isRepeatable: false });
      fetchModules();
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
      await apiService.create(`/hub/teacher/learning-modules/sessions/${currentSessionId}/materials`, materialForm);
      setIsMaterialModalOpen(false);
      setMaterialForm({ title: "", type: "pdf", fileUrl: "" });
      fetchModules();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan materi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublished = async (type: 'module' | 'session', id: number, currentStatus: boolean) => {
    try {
      const endpoint = type === 'module' ? `/hub/teacher/learning-modules/${id}` : `/hub/teacher/learning-modules/sessions/${id}`;
      await apiService.update(endpoint, "", { isPublished: !currentStatus });
      fetchModules();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal mengemas kini status.");
    }
  };

  const handleToggleRepeatable = async (id: number, currentStatus: boolean) => {
    try {
      await apiService.update(`/hub/teacher/learning-modules/sessions/${id}`, "", { isRepeatable: !currentStatus });
      fetchModules();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (type: 'module' | 'session' | 'material', id: number) => {
    if (!confirm(`Padam ${type} ini?`)) return;
    try {
      let endpoint = "";
      if (type === 'module') endpoint = `/hub/teacher/learning-modules/${id}`;
      else if (type === 'session') endpoint = `/hub/teacher/learning-modules/sessions/${id}`;
      else endpoint = `/hub/teacher/learning-modules/materials/${id}`;
      
      await apiService.remove(endpoint, "");
      fetchModules();
    } catch (error) {
      alert("Gagal memadam.");
    }
  };

  const handleAccessMaterial = async (materialId: number, url: string) => {
    if (isStudent) {
      try {
        await apiService.create(`/hub/teacher/learning-modules/materials/${materialId}/access`, {});
      } catch (error) {
        console.error("Failed to log access", error);
      }
    }
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isTeacher ? "Pengurusan Materi" : "Materi Pembelajaran"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher ? "Susun hierarki materi, sesi, dan modul anda" : "Akses modul dan materi pembelajaran anda"}
          </p>
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

      {isTeacher && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setIsModuleModalOpen(true)}>
            <Plus size={16} /> Tambah Modul
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Memuatkan kandungan...</p>
          </div>
        ) : modules.length > 0 ? (
          modules.map((mod) => (
            <Card key={mod.id} className="p-0 overflow-hidden shadow-sm border border-border/60">
              <div className="flex items-center justify-between px-6 py-4 bg-muted/20 border-b border-border/40 group">
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleModule(mod.id)}>
                  {expandedModules.includes(mod.id) ? <ChevronDown size={20} className="text-indigo-500" /> : <ChevronRight size={20} className="text-muted-foreground" />}
                  <div className={`p-2 rounded-lg ${isTeacher ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    <Folder size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                      {mod.title}
                      {isTeacher && !mod.isPublished && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold">Draft</span>}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{mod.description || "Tiada deskripsi modul."}</p>
                  </div>
                </div>
                {isTeacher && (
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleTogglePublished('module', mod.id, mod.isPublished)}>
                      {mod.isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button variant="secondary" size="sm" className="h-8 px-2 text-[11px]" onClick={() => { setCurrentModuleId(mod.id); setIsSessionModalOpen(true); }}>
                      <Plus size={14} /> Sesi
                    </Button>
                    <button onClick={() => handleDelete('module', mod.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {expandedModules.includes(mod.id) && (
                <div className="divide-y divide-border/40">
                  {mod.sessions?.length > 0 ? (
                    mod.sessions.map((session: any) => (
                      <div key={session.id} className="bg-background">
                        <div className="flex items-center justify-between px-6 py-4 ml-8 border-l-2 border-indigo-100 group">
                          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleSession(session.id)}>
                            {expandedSessions.includes(session.id) ? <ChevronDown size={16} className="text-indigo-400" /> : <ChevronRight size={16} className="text-muted-foreground/60" />}
                            <span className={`h-6 w-6 rounded text-[10px] font-bold flex items-center justify-center ${session.isRepeatable ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                              {session.sessionNumber}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-foreground truncate">{session.title}</h4>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {isTeacher && (
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="sm" className="h-7 px-2 text-[10px]" onClick={() => { setCurrentSessionId(session.id); setIsMaterialModalOpen(true); }}>
                                  <Plus size={12} /> Materi
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleTogglePublished('session', session.id, session.isPublished)}>
                                  {session.isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                                </Button>
                                <button onClick={() => handleDelete('session', session.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                            {session.isRepeatable && (
                              <span className="text-[9px] font-bold text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full uppercase">Repeatable</span>
                            )}
                          </div>
                        </div>

                        {expandedSessions.includes(session.id) && (
                          <div className="ml-20 pb-4 pr-6 space-y-2">
                            {session.materials?.length > 0 ? (
                              session.materials.map((mat: any) => (
                                <div key={mat.id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-white hover:shadow-sm transition-all group/mat">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${mat.type === 'video' ? 'bg-rose-50 text-rose-500' : mat.type === 'ppt' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                      {mat.type === 'video' ? <Video size={16} /> : <FileIcon size={16} />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-foreground">{mat.title}</p>
                                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{mat.type} Document</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button 
                                      variant="secondary" 
                                      size="sm" 
                                      className="h-8 text-[11px] font-bold"
                                      onClick={() => handleAccessMaterial(mat.id, mat.fileUrl)}
                                    >
                                      BUKA <ExternalLink size={12} className="ml-1" />
                                    </Button>
                                    {isTeacher && (
                                      <button onClick={() => handleDelete('material', mat.id)} className="p-2 text-muted-foreground hover:text-red-500 transition-colors">
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-xl">
                                Belum ada materi pembelajaran untuk sesi ini.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-12 py-10 text-center text-sm text-muted-foreground">
                      <Lock size={24} className="mx-auto mb-2 opacity-20" />
                      Sesi pembelajaran belum tersedia untuk modul ini.
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-muted/10">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <BookOpen size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Tiada Modul Ditemui</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              {isTeacher ? "Silahkan pilih mata pelajaran atau buat modul baharu." : "Guru anda belum menerbitkan modul pembelajaran bagi subjek ini."}
            </p>
          </div>
        )}
      </div>

      {isTeacher && (
        <>
          {/* Modal Modul */}
          <Modal isOpen={isModuleModalOpen} onClose={() => !isSubmitting && setIsModuleModalOpen(false)} title="Tambah Modul Baharu">
            <div className="p-4 space-y-4">
              <Input 
                label="Tajuk Modul" 
                placeholder="Contoh: Pengenalan Algoritma" 
                value={moduleForm.title}
                onChange={e => setModuleForm({...moduleForm, title: e.target.value})}
              />
              <Input 
                label="Deskripsi (Opsional)" 
                placeholder="Ringkasan tentang apa yang akan dipelajari" 
                value={moduleForm.description}
                onChange={e => setModuleForm({...moduleForm, description: e.target.value})}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsModuleModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddModule} disabled={isSubmitting || !moduleForm.title}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Modul"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Sesi */}
          <Modal isOpen={isSessionModalOpen} onClose={() => !isSubmitting && setIsSessionModalOpen(false)} title="Tambah Pertemuan Baru">
            <div className="p-4 space-y-4">
              <Input 
                label="Tajuk Pertemuan" 
                placeholder="Contoh: Struktur Data Stack" 
                value={sessionForm.title}
                onChange={e => setSessionForm({...sessionForm, title: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="No. Pertemuan (Opsional)" 
                  type="number" 
                  placeholder="Auto" 
                  value={sessionForm.sessionNumber}
                  onChange={e => setSessionForm({...sessionForm, sessionNumber: e.target.value})}
                />
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <input 
                      type="checkbox" 
                      checked={sessionForm.isRepeatable}
                      onChange={e => setSessionForm({...sessionForm, isRepeatable: e.target.checked})}
                      className="rounded border-border text-indigo-600"
                    />
                    Repeatable
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsSessionModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddSession} disabled={isSubmitting || !sessionForm.title}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Sesi"}
                </Button>
              </div>
            </div>
          </Modal>

          {/* Modal Materi */}
          <Modal isOpen={isMaterialModalOpen} onClose={() => !isSubmitting && setIsMaterialModalOpen(false)} title="Muat Naik Materi">
            <div className="p-4 space-y-4">
              <Input 
                label="Tajuk Materi" 
                placeholder="Contoh: Slide Presentasi Stack" 
                value={materialForm.title}
                onChange={e => setMaterialForm({...materialForm, title: e.target.value})}
              />
              <Select 
                label="Jenis Materi"
                options={[
                  { value: "pdf", label: "PDF Document" },
                  { value: "ppt", label: "PowerPoint" },
                  { value: "video", label: "Video Tutorial" }
                ]}
                value={materialForm.type}
                onChange={e => setMaterialForm({...materialForm, type: e.target.value})}
              />
              <Input 
                label="Pautan URL (File/Video)" 
                placeholder="https://example.com/file.pdf" 
                value={materialForm.fileUrl}
                onChange={e => setMaterialForm({...materialForm, fileUrl: e.target.value})}
              />
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="secondary" onClick={() => setIsMaterialModalOpen(false)} disabled={isSubmitting}>Batal</Button>
                <Button onClick={handleAddMaterial} disabled={isSubmitting || !materialForm.title || !materialForm.fileUrl}>
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Simpan Materi"}
                </Button>
              </div>
            </div>
          </Modal>

          <div className="fixed bottom-6 right-6 flex flex-col gap-2">
            <Card className="p-4 bg-indigo-600 text-white shadow-xl max-w-xs border-none animate-in slide-in-from-bottom-4">
              <h5 className="font-bold text-sm mb-1">Status Kurikulum</h5>
              <p className="text-[10px] opacity-90 leading-relaxed">
                Anda telah menggunakan {modules.length}/5 slot modul bagi mata pelajaran ini. Setiap modul dihadirkan kepada 7 sesi pertemuan.
              </p>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
