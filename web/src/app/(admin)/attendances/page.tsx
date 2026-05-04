"use client";

import React, { useState } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { attendances, grades } from "@/lib/mock-data";

const statusConfig: Record<string, { variant: "success" | "warning" | "info" | "danger"; label: string }> = {
  hadir: { variant: "success", label: "Hadir" },
  izin: { variant: "warning", label: "Izin" },
  sakit: { variant: "info", label: "Sakit" },
  alpa: { variant: "danger", label: "Alpa" },
};

export default function AttendancesPage() {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("2025-10-20");
  const [isExporting, setIsExporting] = useState(false);

  const filtered = attendances.filter((a) => {
    const matchSearch = a.studentName.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade ? a.gradeName === filterGrade : true;
    const matchStatus = filterStatus ? a.status === filterStatus : true;
    const matchDate = filterDate ? a.date === filterDate : true;
    return matchSearch && matchGrade && matchStatus && matchDate;
  });

  const summary = {
    hadir: filtered.filter((a) => a.status === "hadir").length,
    izin: filtered.filter((a) => a.status === "izin").length,
    sakit: filtered.filter((a) => a.status === "sakit").length,
    alpa: filtered.filter((a) => a.status === "alpa").length,
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      
      const token = localStorage.getItem("jwt_token");
      if (!token) throw new Error("Anda belum login");

      const response = await fetch("http://localhost:4000/api/attendances/export/excel", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal mengunduh file Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "Rekap_Kehadiran_Maleo.xlsx";
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error(error);
      alert("Gagal mengunduh file. Pastikan server aktif.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rekap Kehadiran</h1>
          <p className="text-sm text-muted-foreground mt-1">Pantau kehadiran siswa per hari</p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExportExcel} disabled={isExporting}>
          {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isExporting ? "Menyiapkan..." : "Export"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
          <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">{summary.hadir}</div>
          <div><p className="text-sm font-semibold text-emerald-700">Hadir</p><p className="text-xs text-emerald-600">{filtered.length ? ((summary.hadir / filtered.length) * 100).toFixed(0) : 0}%</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
          <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-sm">{summary.izin}</div>
          <div><p className="text-sm font-semibold text-amber-700">Izin</p><p className="text-xs text-amber-600">{filtered.length ? ((summary.izin / filtered.length) * 100).toFixed(0) : 0}%</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
          <div className="h-10 w-10 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-sm">{summary.sakit}</div>
          <div><p className="text-sm font-semibold text-blue-700">Sakit</p><p className="text-xs text-blue-600">{filtered.length ? ((summary.sakit / filtered.length) * 100).toFixed(0) : 0}%</p></div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50">
          <div className="h-10 w-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold text-sm">{summary.alpa}</div>
          <div><p className="text-sm font-semibold text-red-700">Alpa</p><p className="text-xs text-red-600">{filtered.length ? ((summary.alpa / filtered.length) * 100).toFixed(0) : 0}%</p></div>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1"><Input placeholder="Cari nama siswa..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="w-36"><Select placeholder="Semua Kelas" options={grades.map(g => ({value: g.name, label: g.name}))} value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} /></div>
          <div className="w-36"><Select placeholder="Semua Status" options={[{value:"hadir",label:"Hadir"},{value:"izin",label:"Izin"},{value:"sakit",label:"Sakit"},{value:"alpa",label:"Alpa"}]} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} /></div>
          <div className="w-44"><Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">No</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Siswa</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kelas</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tanggal</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((att, i) => {
                const config = statusConfig[att.status];
                return (
                  <tr key={att.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={att.studentName} size="sm" />
                        <span className="font-medium text-foreground">{att.studentName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4"><Badge variant="info">{att.gradeName}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(att.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="py-3 px-4"><Badge variant={config.variant}>{config.label}</Badge></td>
                    <td className="py-3 px-4 text-muted-foreground">{att.note || "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
