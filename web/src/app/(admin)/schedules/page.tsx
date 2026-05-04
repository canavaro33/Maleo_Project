"use client";

import React, { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/apiService";

const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const dayColors: Record<string, string> = {
  Senin: "bg-indigo-50 border-indigo-200",
  Selasa: "bg-emerald-50 border-emerald-200",
  Rabu: "bg-violet-50 border-violet-200",
  Kamis: "bg-amber-50 border-amber-200",
  Jumat: "bg-rose-50 border-rose-200",
};
const dayTextColors: Record<string, string> = {
  Senin: "text-indigo-700",
  Selasa: "text-emerald-700",
  Rabu: "text-violet-700",
  Kamis: "text-amber-700",
  Jumat: "text-rose-700",
};

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    day: "",
    startTime: "",
    endTime: "",
    subjectId: "",
    teacherId: "",
    classId: "",
    room: "",
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [schedRes, classRes, subRes, teachRes] = await Promise.all([
        apiService.getAll("/schedules"),
        apiService.getAll("/classes"),
        apiService.getAll("/subjects"),
        apiService.getAll("/teachers"),
      ]);
      setSchedules(schedRes.data);
      setClasses(classRes.data);
      setSubjects(subRes.data);
      setTeachers(teachRes.data);
      if (classRes.data.length > 0 && !filterClass) {
        setFilterClass(classRes.data[0].name);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data jadwal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setFormData({
      day: "",
      startTime: "",
      endTime: "",
      subjectId: "",
      teacherId: "",
      classId: "",
      room: "",
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await apiService.create("/schedules", formData);
      setSuccess("Jadwal berhasil ditambahkan");
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan jadwal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = schedules.filter((s) => (filterClass ? s.className === filterClass : true));

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg animate-in fade-in slide-in-from-top-1">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg animate-in fade-in slide-in-from-top-1">
          {success}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jadwal Pelajaran</h1>
          <p className="text-sm text-muted-foreground mt-1">Jadwal pelajaran per kelas per hari</p>
        </div>
        <Button size="sm" onClick={openAddModal}>
          <Plus size={16} />
          Tambah Jadwal
        </Button>
      </div>

      <div className="w-full sm:w-64">
        <Select
          label="Filter Kelas"
          options={classes.map((c) => ({ value: c.name, label: c.name }))}
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          placeholder="Pilih kelas..."
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="animate-spin mb-2" size={32} />
          <p>Memuat jadwal pelajaran...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => {
            const daySchedules = filtered.filter((s) => s.day === day);
            if (daySchedules.length === 0) return null;
            return (
              <Card key={day} padding={false}>
                <div className={`px-6 py-3 border-b ${dayColors[day]}`}>
                  <h3 className={`font-semibold ${dayTextColors[day]}`}>{day}</h3>
                </div>
                <div className="divide-y divide-border">
                  {daySchedules.map((schedule) => (
                    <div key={schedule.id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 hover:bg-accent/30 transition-colors">
                      <div className="w-32 shrink-0">
                        <p className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md inline-block">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">{schedule.subjectName}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral" className="bg-slate-100">{schedule.teacherName}</Badge>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge variant="info" className="font-mono">{schedule.room}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && filterClass && (
            <div className="p-10 text-center text-muted-foreground bg-card rounded-xl border border-border border-dashed">
              Tidak ada jadwal pelajaran untuk kelas {filterClass}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title="Tambah Jadwal Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          {(subjects.length === 0 || teachers.length === 0 || classes.length === 0) && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium">Data Mata Pelajaran, Guru, atau Kelas belum lengkap. Silakan isi data master tersebut terlebih dahulu sebelum membuat Jadwal.</p>
            </div>
          )}
          <Select 
            label="Hari" 
            options={days.map(d => ({value: d, label: d}))} 
            placeholder="Pilih hari" 
            value={formData.day}
            onChange={(e) => setFormData({...formData, day: e.target.value})}
            required
            disabled={subjects.length === 0 || teachers.length === 0 || classes.length === 0}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Jam Mulai" 
              type="time" 
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              required 
              disabled={subjects.length === 0 || teachers.length === 0 || classes.length === 0}
            />
            <Input 
              label="Jam Selesai" 
              type="time" 
              value={formData.endTime}
              onChange={(e) => setFormData({...formData, endTime: e.target.value})}
              required 
              disabled={subjects.length === 0 || teachers.length === 0 || classes.length === 0}
            />
          </div>
          <Select 
            label="Mata Pelajaran" 
            options={subjects.map(s => ({value: String(s.id), label: s.name}))} 
            placeholder="Pilih mapel" 
            value={formData.subjectId}
            onChange={(e) => setFormData({...formData, subjectId: e.target.value})}
            required
            disabled={subjects.length === 0}
          />
          <Select 
            label="Guru" 
            options={teachers.map(t => ({value: String(t.id), label: t.name}))} 
            placeholder="Pilih guru" 
            value={formData.teacherId}
            onChange={(e) => setFormData({...formData, teacherId: e.target.value})}
            required
            disabled={teachers.length === 0}
          />
          <Select 
            label="Kelas" 
            options={classes.map(c => ({value: String(c.id), label: c.name}))} 
            placeholder="Pilih kelas" 
            value={formData.classId}
            onChange={(e) => setFormData({...formData, classId: e.target.value})}
            required
            disabled={classes.length === 0}
          />
          <Input 
            label="Ruang" 
            placeholder="Contoh: R.101" 
            value={formData.room}
            onChange={(e) => setFormData({...formData, room: e.target.value})}
            required 
            disabled={subjects.length === 0 || teachers.length === 0 || classes.length === 0}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button type="submit" disabled={isSubmitting || subjects.length === 0 || teachers.length === 0 || classes.length === 0}>
              {isSubmitting ? (
                <><Loader2 className="animate-spin mr-2" size={16} />Menyimpan...</>
              ) : "Tambah Jadwal"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
