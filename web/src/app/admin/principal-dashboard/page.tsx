"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  School,
  TrendingUp,
  Award,
  CalendarDays,
  Loader2,
  FileDown,
  ChevronRight,
  Activity,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";

// Mock data for top performers
const topPerformers = [
  { name: "Andi Saputra", class: "XII-IPA-1", score: 95, attendance: "100%" },
  { name: "Budi Santoso", class: "XII-IPA-2", score: 92, attendance: "98%" },
  { name: "Citra Lestari", class: "XI-IPS-1", score: 90, attendance: "99%" },
];

export default function PrincipalDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await apiService.getAll("/dashboard/summary");
        setSummary(response.data);
      } catch (error) {
        console.error("Gagal mengambil data dashboard", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Menyiapkan data pemantauan...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Siswa",
      value: summary?.totalStudents ?? 0,
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      trend: "Data Real-time",
    },
    {
      label: "Total Guru",
      value: summary?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      trend: "Tenaga Pendidik",
    },
    {
      label: "Kehadiran Sekolah",
      value: `${summary?.attendanceRate ?? 0}%`,
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50",
      trend: "Rata-rata Bulan Ini",
    },
    {
      label: "Rerata Nilai",
      value: summary?.averageScore ?? 0,
      icon: Award,
      color: "text-violet-600",
      bg: "bg-violet-50",
      trend: "Kesehatan Akademik",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoring Kepala Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ringkasan eksekutif kesehatan akademik dan operasional sekolah
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" className="gap-2">
            <FileDown size={16} /> Export PDF
          </Button>
          <Button variant="secondary" size="sm" className="gap-2">
            <FileDown size={16} /> Excel
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 border-none shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground font-medium">{stat.trend}</span>
                <ChevronRight size={12} className="text-muted-foreground" />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Academic Health Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tren Capaian Akademik</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Perbandingan nilai rata-rata antar bulan</p>
            </div>
            <Badge variant="info">{summary?.academicYear}</Badge>
          </CardHeader>
          <div className="h-80 px-4 pb-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { month: "Jan", score: 75 },
                { month: "Feb", score: 78 },
                { month: "Mar", score: 82 },
                { month: "Apr", score: 80 },
                { month: "Mei", score: 85 },
                { month: "Jun", score: 88 },
              ]}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-20" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Area type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Performers (Placeholder) */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Siswa Berprestasi</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Peringkat teratas berdasarkan nilai</p>
          </CardHeader>
          <div className="space-y-4 px-6 pb-6">
            {topPerformers.map((student, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{student.name}</p>
                    <p className="text-[10px] text-muted-foreground">{student.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">{student.score}</p>
                  <p className="text-[10px] text-muted-foreground">Skor</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600 font-bold mt-2">
              LIHAT SEMUA PERINGKAT
            </Button>
          </div>
        </Card>
      </div>

      {/* School Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
          <div className="p-2 bg-emerald-500 rounded-lg text-white">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">Kesehatan Akademik Stabil</h4>
            <p className="text-xs text-emerald-700 mt-1">
              Rata-rata nilai sekolah meningkat 4% dibandingkan semester lalu. Program remedial berjalan efektif.
            </p>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
          <div className="p-2 bg-amber-500 rounded-lg text-white">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-900">Perhatian Kehadiran</h4>
            <p className="text-xs text-amber-700 mt-1">
              Terdapat penurunan kehadiran sebesar 2% pada level Kelas XI. Disarankan koordinasi dengan Wali Kelas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
