"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, Users, Loader2, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/apiService";

interface Guardian {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  occupation: string;
  userCode: string | null;
  children: { id: number; name: string; className: string }[];
}

export default function GuardiansPage() {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuardian, setEditingGuardian] = useState<Guardian | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    occupation: "",
  });

  const fetchGuardians = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll("/guardians");
      setGuardians(response.data);
    } catch (err: any) {
      setError("Gagal mengambil data wali murid");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const filtered = guardians.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.phone.includes(search)
  );

  const openAdd = () => {
    setEditingGuardian(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      occupation: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (guardian: Guardian) => {
    setEditingGuardian(guardian);
    setFormData({
      name: guardian.name,
      phone: guardian.phone,
      email: guardian.email,
      address: guardian.address,
      occupation: guardian.occupation,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      if (editingGuardian) {
        await apiService.update("/guardians", editingGuardian.id, formData);
        setSuccess("Data wali murid berhasil diperbarui");
      } else {
        await apiService.create("/guardians", formData);
        setSuccess("Wali murid baru berhasil ditambahkan");
      }
      await fetchGuardians();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal menyimpan data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus data wali murid ini?")) return;
    try {
      await apiService.remove("/guardians", id);
      setSuccess("Wali murid berhasil dihapus");
      await fetchGuardians();
    } catch (err) {
      setError("Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6">
      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}
      {success && <div className="p-4 bg-green-50 text-green-600 rounded-lg border border-green-200">{success}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Wali Murid</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola data orang tua/wali murid</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={fetchGuardians}>
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
          <Button size="sm" onClick={openAdd}>
            <Plus size={16} />
            Tambah Wali Murid
          </Button>
        </div>
      </div>

      <Card>
        <div className="mb-6">
          <Input placeholder="Cari nama atau telepon..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="animate-spin mb-2" size={32} />
              <p>Memuat data...</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">No</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Wali Murid</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kode Login</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Telepon</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Pekerjaan</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Anak</th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((guardian, i) => (
                  <tr key={guardian.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={guardian.name} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">{guardian.name}</p>
                          <p className="text-xs text-muted-foreground">{guardian.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600">{guardian.userCode || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{guardian.phone}</td>
                    <td className="py-3 px-4">{guardian.occupation}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {guardian.children && guardian.children.length > 0 ? (
                          guardian.children.map((child) => (
                            <div key={child.id} className="flex items-center gap-2">
                              <Users size={12} className="text-muted-foreground" />
                              <span className="text-xs">{child.name}</span>
                              <Badge variant="info">{child.className}</Badge>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Belum terhubung</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(guardian)} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(guardian.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => !isSubmitting && setIsModalOpen(false)} title={editingGuardian ? "Edit Wali Murid" : "Tambah Wali Murid Baru"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nama Lengkap" placeholder="Masukkan nama" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <Input label="Telepon" placeholder="08xxxxxxxxxx" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
            <Input label="Email" type="email" placeholder="email@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            <Input label="Pekerjaan" placeholder="Masukkan pekerjaan" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} required />
          </div>
          <Input label="Alamat" placeholder="Masukkan alamat lengkap" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} required />
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" type="button" disabled={isSubmitting} onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingGuardian ? "Simpan Perubahan" : "Tambah Wali Murid")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
