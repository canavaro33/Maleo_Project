"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  CalendarDays,
  Loader2
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { apiService } from "@/services/apiService";

import { attendanceChartData } from "@/lib/mock-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function DashboardPage() {
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

  const statCards = [
    {
      label: "Total Siswa",
      value: summary?.totalStudents ?? 0,
      icon: Users,
      color: "from-indigo-500 to-indigo-600",
      shadow: "shadow-indigo-500/25",
      change: "+12",
      trend: "up",
    },
    {
      label: "Total Guru",
      value: summary?.totalTeachers ?? 0,
      icon: GraduationCap,
      color: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/25",
      change: "+2",
      trend: "up",
    },
    {
      label: "Total Kelas",
      value: summary?.totalClasses ?? 0,
      icon: School,
      color: "from-violet-500 to-violet-600",
      shadow: "shadow-violet-500/25",
      change: "0",
      trend: "neutral",
    },
    {
      label: "Mata Pelajaran",
      value: summary?.totalSubjects ?? 0,
      icon: BookOpen,
      color: "from-amber-500 to-amber-600",
      shadow: "shadow-amber-500/25",
      change: "+1",
      trend: "up",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <Loader2 className="animate-spin mb-2" size={32} />
        <p>Sinkronisasi data database...</p>
      </div>
    );
  }

  const announcements = summary?.recentAnnouncements || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selamat datang di Maleo SIAKAD — Ringkasan informasi akademik
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === "up" ? (
                      <ArrowUpRight size={14} className="text-emerald-500" />
                    ) : stat.trend === "down" ? (
                      <ArrowDownRight size={14} className="text-red-500" />
                    ) : null}
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === "up"
                          ? "text-emerald-500"
                          : stat.trend === "down"
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {stat.change} semester ini
                    </span>
                  </div>
                </div>
                <div
                  className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg ${stat.shadow}`}
                >
                  <Icon size={22} className="text-white" />
                </div>
              </div>
              <div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}
              />
            </Card>
          );
        })}
      </div>

      {/* Charts & Quick Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Rekap Kehadiran Bulanan</CardTitle>
            <Badge variant="info">Semester Ganjil {summary?.academicYear}</Badge>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid hsl(var(--border))",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="hadir"
                  fill="#4F46E5"
                  name="Hadir"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="izin"
                  fill="#F59E0B"
                  name="Izin"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="sakit"
                  fill="#06B6D4"
                  name="Sakit"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="alpa"
                  fill="#EF4444"
                  name="Alpa"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Statistik Cepat</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <TrendingUp size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Kehadiran
                  </p>
                  <p className="text-xs text-muted-foreground">Rata-rata</p>
                </div>
              </div>
              <span className="text-xl font-bold text-emerald-600">
                {summary?.attendanceRate}%
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-50 border border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-lg">
                  <Award size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Nilai Rata-rata
                  </p>
                  <p className="text-xs text-muted-foreground">Semua mapel</p>
                </div>
              </div>
              <span className="text-xl font-bold text-indigo-600">
                {summary?.averageScore}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-violet-50 border border-violet-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500 rounded-lg">
                  <CalendarDays size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Tahun Ajaran
                  </p>
                  <p className="text-xs text-muted-foreground">Aktif</p>
                </div>
              </div>
              <span className="text-sm font-bold text-violet-600">
                {summary?.academicYear}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman Terbaru</CardTitle>
          <Badge variant="neutral">{announcements.length} aktif</Badge>
        </CardHeader>
        <div className="space-y-3">
          {announcements.length > 0 ? (
            announcements.map((announcement: any) => (
              <div
                key={announcement.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-indigo-50 shrink-0">
                  <Megaphone size={18} className="text-indigo-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {announcement.title}
                    </p>
                    {announcement.priority === "important" && (
                      <Badge variant="warning">Penting</Badge>
                    )}
                    {announcement.priority === "urgent" && (
                      <Badge variant="danger">Urgent</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {announcement.content}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {new Date(announcement.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground italic">
              Belum ada pengumuman yang diterbitkan.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
