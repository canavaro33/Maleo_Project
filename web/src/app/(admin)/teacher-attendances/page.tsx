"use client";
import React, { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function TeacherAttendancesPage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null);
  const [overrideForm, setOverrideForm] = useState({
    status: "",
    note: "",
    overrideReason: "",
  });
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setUserRole(user.role);
    fetchAttendances();
  }, [selectedMonth, selectedYear]);

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const res = await apiService.get("/teacher-attendances", {
        month: selectedMonth,
        year: selectedYear,
      });
      setAttendances(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    window.open(
      `${apiUrl}/teacher-attendances/export?month=${selectedMonth}&year=${selectedYear}`,
      '_blank'
    );
  };

  const openOverrideModal = (a: any) => {
    setSelectedAttendance(a);
    setOverrideForm({
      status: a.status,
      note: a.note || "",
      overrideReason: "",
    });
    setIsOverrideModalOpen(true);
  };

  const handleOverride = async () => {
    if (!overrideForm.overrideReason) {
      alert("Alasan override wajib diisi.");
      return;
    }
    try {
      await apiService.put(
        `/teacher-attendances/${selectedAttendance.id}/override`,
        overrideForm
      );
      setIsOverrideModalOpen(false);
      fetchAttendances();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal override.");
    }
  };

  const months = [
    { value: 1, label: "Januari" },
    { value: 2, label: "Februari" },
    { value: 3, label: "Maret" },
    { value: 4, label: "April" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Juni" },
    { value: 7, label: "Juli" },
    { value: 8, label: "Agustus" },
    { value: 9, label: "September" },
    { value: 10, label: "Oktober" },
    { value: 11, label: "November" },
    { value: 12, label: "Desember" },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kehadiran Guru</h1>
          <p className="text-muted-foreground">Monitoring kehadiran dan keterlambatan guru</p>
        </div>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
        >
          Export Excel
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Data Kehadiran</CardTitle>
            <div className="flex gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="border p-2 rounded-md"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border p-2 rounded-md"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="p-3">No</th>
                    <th className="p-3">Nama Guru</th>
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Jam Masuk</th>
                    <th className="p-3">Keterangan</th>
                    <th className="p-3">Tipe Input</th>
                    {userRole === "admin" && <th className="p-3">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {attendances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-muted-foreground">
                        Belum ada data kehadiran di bulan ini.
                      </td>
                    </tr>
                  ) : (
                    attendances.map((a, i) => (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">{i + 1}</td>
                        <td className="p-3 font-medium">{a.teacher.name}</td>
                        <td className="p-3">{new Date(a.date).toLocaleDateString('id-ID')}</td>
                        <td className="p-3">
                          <Badge
                            className={
                              a.status === 'hadir' ? 'bg-emerald-500 hover:bg-emerald-600' :
                              a.status === 'terlambat' ? 'bg-amber-500 hover:bg-amber-600' :
                              a.status === 'izin' ? 'bg-blue-500 hover:bg-blue-600' :
                              a.status === 'sakit' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                              'bg-rose-500 hover:bg-rose-600'
                            }
                          >
                            {a.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {a.checkinAt ? new Date(a.checkinAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {a.isLate && <span className="ml-2 text-amber-600 text-xs">(Terlambat {a.lateMinutes}m)</span>}
                        </td>
                        <td className="p-3">{a.note || '-'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${a.checkinType === 'self' ? 'bg-slate-100 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                            {a.checkinType === 'self' ? 'Mandiri' : 'Override'}
                          </span>
                        </td>
                        {userRole === "admin" && (
                          <td className="p-3">
                            <button
                              onClick={() => openOverrideModal(a)}
                              className="text-indigo-600 hover:underline text-sm font-medium"
                            >
                              Edit/Override
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isOverrideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-1">Override Kehadiran Guru</h3>
            <p className="text-sm text-slate-500 mb-4">Guru: {selectedAttendance.teacher.name}</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status Baru</label>
                <select
                  className="w-full border p-2 rounded"
                  value={overrideForm.status}
                  onChange={(e) => setOverrideForm({ ...overrideForm, status: e.target.value })}
                >
                  <option value="hadir">Hadir</option>
                  <option value="terlambat">Terlambat</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="alpa">Alpa</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={overrideForm.note}
                  onChange={(e) => setOverrideForm({ ...overrideForm, note: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alasan Override <span className="text-red-500">*</span></label>
                <textarea
                  required
                  className="w-full border p-2 rounded"
                  placeholder="Contoh: Salah klik saat check-in"
                  value={overrideForm.overrideReason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, overrideReason: e.target.value })}
                ></textarea>
                <p className="text-xs text-slate-500 mt-1">Alasan ini akan dicatat untuk audit trail.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="px-4 py-2 border rounded-md"
              >
                Batal
              </button>
              <button
                onClick={handleOverride}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
