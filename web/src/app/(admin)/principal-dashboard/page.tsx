"use client";

import React, { useState, useEffect } from "react";
import {
  Users, GraduationCap, Award, Activity, CalendarDays,
  Loader2, FileDown, ChevronRight, CheckCircle2, AlertCircle, BookOpen, UserCheck
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";

export default function PrincipalDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiService.getAll("/principal/summary");
        setSummary(res.data);
      } catch {
        setError("Gagal memuat data dashboard. Pastikan server berjalan.");
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-2">
        <AlertCircle size={32} />
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  const statCards = [
    { label: "Total Siswa",       value: summary?.totalStudents ?? 0,       icon: Users,        color: "text-indigo-600",  bg: "bg-indigo-50",  trend: "Siswa Aktif" },
    { label: "Guru Aktif",        value: summary?.totalTeachers ?? 0,       icon: GraduationCap,color: "text-emerald-600", bg: "bg-emerald-50", trend: "Tenaga Pendidik" },
    { label: "Kehadiran Sekolah", value: `${summary?.attendanceRate ?? 0}%`,icon: Activity,     color: "text-amber-600",  bg: "bg-amber-50",   trend: "Rata-rata Bulan Ini" },
    { label: "Rerata Nilai",      value: summary?.averageScore ?? 0,        icon: Award,        color: "text-violet-600", bg: "bg-violet-50",  trend: "Kesehatan Akademik" },
    { label: "Kehadiran Guru",    value: `${summary?.teacherAttendanceRate ?? 0}%`, icon: UserCheck, color: "text-teal-600", bg: "bg-teal-50", trend: "Rata-rata Bulan Ini" },
  ];

  const lowAlerts: any[] = summary?.lowAttendanceAlert || [];
  const topStudents: any[] = summary?.topStudents || [];
  const attendanceByClass: any[] = summary?.attendanceByClass || [];
  const announcements: any[] = summary?.recentAnnouncements || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoring Kepala Sekolah</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Ringkasan eksekutif kesehatan akademik dan operasional sekolah
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info">{summary?.academicYear ?? "-"}</Badge>
          <Button variant="secondary" size="sm" className="gap-2">
            <FileDown size={16} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-5 border-none shadow-sm bg-card hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{stat.value}</p>
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

      {/* Info bar — totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Kelas",    value: summary?.totalClasses ?? 0,  icon: BookOpen },
          { label: "Total Mapel",    value: summary?.totalSubjects ?? 0, icon: CalendarDays },
          { label: "Kelas Bermasalah", value: lowAlerts.length,          icon: AlertCircle },
          { label: "Siswa Berprestasi", value: topStudents.length,       icon: Award },
        ].map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-4 rounded-xl bg-muted/30 flex items-center gap-3">
              <Icon size={18} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Class Bar Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Kehadiran Per Kelas</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Persentase kehadiran bulan ini per kelas</p>
            </div>
            <Badge variant={summary?.attendanceRate >= 80 ? "success" : "warning"}>
              Global: {summary?.attendanceRate ?? 0}%
            </Badge>
          </CardHeader>
          <div className="h-64 px-4 pb-4">
            {attendanceByClass.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceByClass}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => [`${v}%`, "Kehadiran"]} />
                  <Bar dataKey="rate" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Kehadiran" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Belum ada data kehadiran bulan ini.
              </div>
            )}
          </div>
        </Card>

        {/* Top Students */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Siswa Berprestasi</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Peringkat teratas berdasarkan nilai</p>
          </CardHeader>
          <div className="space-y-3 px-6 pb-6">
            {topStudents.length > 0 ? topStudents.map((siswa: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{siswa.name}</p>
                    <p className="text-[10px] text-muted-foreground">{siswa.className}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-500">{siswa.avgScore}</p>
                  <p className="text-[10px] text-muted-foreground">Skor</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada data nilai.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Alerts & Announcements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alert Siswa Berisiko */}
        {(summary?.atRiskStudents || []).length > 0 && (
          <div className="md:col-span-2 space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Siswa Berisiko Dropout
                <span className="text-xs font-normal bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {summary.atRiskCount} siswa
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.atRiskStudents.map((s: any) => (
                <Card key={s.studentId} className="p-4 border-l-4 border-l-rose-500">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-foreground text-sm">{s.name}</p>
                      <p className="text-xs text-muted-foreground">{s.className}</p>
                      {s.guardian && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Wali: {s.guardian.name}
                          {s.guardian.phone && (
                            <span className="ml-2 text-indigo-600 font-medium">
                              {s.guardian.phone}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-rose-600">{s.attendanceRate}%</p>
                      <p className="text-[10px] text-muted-foreground">Kehadiran<br/>bulan ini</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
        {/* Low attendance alert */}
        {lowAlerts.length > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
            <div className="p-2 bg-amber-500 rounded-lg text-white shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Perhatian: Kehadiran Rendah
              </h4>
              <p className="text-xs text-amber-700 mt-1">
                {lowAlerts.length} kelas memiliki kehadiran di bawah 80% bulan ini:&nbsp;
                {lowAlerts.map((c: any) => `${c.className} (${c.rate}%)`).join(", ")}.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
            <div className="p-2 bg-emerald-500 rounded-lg text-white shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900">Kehadiran Normal</h4>
              <p className="text-xs text-emerald-700 mt-1">
                Semua kelas memiliki tingkat kehadiran di atas 80% bulan ini.
              </p>
            </div>
          </div>
        )}

        {/* Recent announcements */}
        <Card className="border-none shadow-sm p-4">
          <h4 className="text-sm font-bold text-foreground mb-3">Pengumuman Terbaru</h4>
          {announcements.length > 0 ? (
            <ul className="space-y-2">
              {announcements.map((a: any, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">{a.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">Belum ada pengumuman.</p>
          )}
        </Card>
        </div>
      </div>
    </div>
  );
}
