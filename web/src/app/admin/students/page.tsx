"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/apiService";
import { Student, Grade } from "@/types";

export default function StudentsPage() {
  // State data
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    nis: "",
    gender: "",
    birthDate: "",
    classId: "",
    phone: "",
    address: "",
  });

  // 1. Fetch data on mount
  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, classesRes] = await Promise.all([
        apiService.getAll("/students"),
        apiService.getAll("/classes"),
      ]);
      
      // Backend mapping: class -> gradeName for frontend compatibility
      const mappedStudents = studentsRes.data.map((s: any) => ({
        ...s,
        gradeName: s.class?.name || "N/A",
        gradeId: s.classId
      }));

      setStudents(mappedStudents);
      setClasses(classesRes.data);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data dari server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter logic
  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search);
    const matchClass = filterClass ? String(s.gradeId) === filterClass : true;
    return matchSearch && matchClass;
  });

  // Modal actions
  const openAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      nis: "",
      gender: "",
      birthDate: "",
      classId: "",
      phone: "",
      address: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      nis: student.nis,
      gender: student.gender,
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      classId: String(student.gradeId),
      phone: student.phone,
      address: student.address,
    });
    setIsModalOpen(true);
  };

  // 2. Handle Submit (POST/PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingStudent) {
        await apiService.update("/students", editingStudent.id, formData);
        setSuccess("Data siswa berhasil diperbarui");
      } else {
        await apiService.create("/students", formData);
        setSuccess("Siswa baru berhasil ditambahkan");
      }
      
      // 3. Re-fetch data automatically
      await fetchData();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
    
    try {
      await apiService.remove("/students", id);
      setSuccess("Data siswa berhasil dihapus");
      await fetchData();
    } catch (err: any) {
      setError("Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
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
          <h1 className="text-2xl font-bold text-foreground">Data Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data siswa sekolah secara real-time
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => fetchData()}>
            Refresh
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus size={16} />
            Tambah Siswa
          </Button>
        </div>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Cari nama atau NIS..."
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              placeholder="Semua Kelas"
              options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Memuat data siswa...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">No</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Siswa</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">NIS</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kode Login</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kelas</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Jenis Kelamin</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((student, i) => (
                    <tr key={student.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                      <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={student.name} size="sm" />
                          <div>
                            <p className="font-medium text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{student.nis}</td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600">{student.userCode || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant="info">{student.gradeName}</Badge>
                      </td>
                      <td className="py-3 px-4">{student.gender === "L" ? "Laki-laki" : "Perempuan"}</td>
                      <td className="py-3 px-4">
                        <Badge variant={student.status === "active" ? "success" : "danger"}>
                          {student.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(student)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(student.id)}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      Tidak ada data siswa ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        title={editingStudent ? "Edit Siswa" : "Tambah Siswa Baru"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {classes.length === 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <p className="text-sm font-medium">Data Kelas belum tersedia. Silakan buat Kelas terlebih dahulu di menu Data Kelas.</p>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap"
              placeholder="Masukkan nama siswa"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="NIS"
              placeholder="Masukkan NIS"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              required
            />
            <Select
              label="Jenis Kelamin"
              options={[
                { value: "L", label: "Laki-laki" },
                { value: "P", label: "Perempuan" },
              ]}
              placeholder="Pilih"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            />
            <Input
              label="Tanggal Lahir"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              required
            />
            <Select
              label="Kelas"
              options={classes.map((c) => ({ value: String(c.id), label: c.name }))}
              placeholder="Pilih kelas"
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              required
              disabled={classes.length === 0}
            />
            <Input
              label="Telepon"
              placeholder="08xxxxxxxxxx"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <Input
            label="Alamat"
            placeholder="Masukkan alamat lengkap"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="secondary"
              type="button"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || classes.length === 0}>
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Menyimpan...
                </>
              ) : (
                editingStudent ? "Simpan Perubahan" : "Tambah Siswa"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
