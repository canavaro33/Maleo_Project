"use client";

import React, { useState, useEffect } from "react";
import { 
  UserPlus, 
  Search, 
  MoreVertical, 
  RefreshCcw, 
  Trash2, 
  ShieldCheck,
  Loader2,
  Info
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { apiService } from "@/services/apiService";

export default function PrincipalManagement() {
  const [principals, setPrincipals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", nip: "" });

  const fetchPrincipals = async () => {
    setLoading(true);
    try {
      const res = await apiService.getAll("/principals");
      setPrincipals(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrincipals();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nip) return;
    
    setIsSubmitting(true);
    try {
      await apiService.create("/principals", formData);
      setIsModalOpen(false);
      setFormData({ name: "", nip: "" });
      fetchPrincipals();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!confirm("Reset password Kepala Sekolah ini ke format default (K + 3 digit NIP)?")) return;
    
    try {
      const res = await apiService.create(`/principals/${id}/reset-password`, {});
      alert(res.message || "Password berhasil direset.");
    } catch (error) {
      alert("Gagal mereset password.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data Kepala Sekolah ini? Akun login juga akan dihapus.")) return;

    try {
      await apiService.remove("/principals", id);
      fetchPrincipals();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menghapus data.");
    }
  };

  const filteredData = principals.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.nip.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Kepala Sekolah</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manajemen akun dan profil pimpinan sekolah
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <UserPlus size={18} /> Tambah Kepala Sekolah
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Cari nama atau NIP..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={fetchPrincipals} disabled={loading}>
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-muted/30 text-muted-foreground font-semibold">
              <tr>
                <th className="px-6 py-4">Nama / NIP</th>
                <th className="px-6 py-4">Kode Sistem</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{p.name}</div>
                      <div className="text-xs text-muted-foreground">NIP: {p.nip}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-bold">
                      {p.principalCode}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.status === "active" ? "success" : "neutral"}>
                        {p.status === "active" ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        title="Reset Password"
                        onClick={() => handleResetPassword(p.id)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <ShieldCheck size={18} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDelete(p.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                    Belum ada data Kepala Sekolah.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => !isSubmitting && setIsModalOpen(false)} 
        title="Tambah Kepala Sekolah Baru"
      >
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <Input 
            label="Nama Lengkap" 
            placeholder="Masukkan nama lengkap" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <Input 
            label="NIP (Nomor Induk Pegawai)" 
            placeholder="Contoh: 198701012010011190" 
            required
            value={formData.nip}
            onChange={e => setFormData({...formData, nip: e.target.value})}
          />
          
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Info size={16} /> Logika Sistem Otomatis
            </div>
            <ul className="text-xs text-indigo-600 space-y-1 list-disc ml-4">
              <li>Sistem akan menghasilkan kode <b>Kxxx</b> secara otomatis.</li>
              <li>Password default adalah <b>K + 3 digit kode sistem</b>.</li>
              <li>Contoh: Kode K602 &rarr; Password: <b>K602</b>.</li>
              <li>Akun akan ditandai wajib ganti password pada login pertama.</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.name || !formData.nip}>
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Simpan Data"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
