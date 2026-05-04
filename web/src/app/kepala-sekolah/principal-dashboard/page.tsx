"use client";

import React, { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Users, 
  GraduationCap, 
  Calendar,
  ChevronRight,
  Target,
  Award,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export default function PrincipalDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulasi loading data dashboard
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Executive Summary</h1>
          <p className="text-slate-500 mt-1">Monitoring kesehatan akademik Maleo Hub secara real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" className="px-3 py-1 bg-emerald-100 text-emerald-700 border-emerald-200">
            Tahun Ajaran 2023/2024 - Genap
          </Badge>
          <Button variant="outline" className="gap-2 border-slate-200 hover:bg-slate-50">
            Download Report <ArrowUpRight size={16} />
          </Button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Siswa", value: "1,248", change: "+12%", icon: Users, color: "bg-blue-500" },
          { label: "Kehadiran Rata-rata", value: "94.2%", change: "+2.4%", icon: Activity, color: "bg-emerald-500" },
          { label: "Rerata Nilai Akhir", value: "84.5", change: "+5.1%", icon: Award, color: "bg-amber-500" },
          { label: "Guru Aktif", value: "84", change: "Stable", icon: GraduationCap, color: "bg-indigo-500" },
        ].map((stat, i) => (
          <Card key={i} className="p-6 border-none shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
            <div className={`absolute top-0 right-0 w-24 h-24 ${stat.color} opacity-5 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-110`} />
            <div className="flex justify-between items-start relative z-10">
              <div className={`p-3 rounded-2xl ${stat.color} text-white shadow-lg shadow-blue-500/10`}>
                <stat.icon size={24} />
              </div>
              <Badge className={stat.change.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-none" : "bg-slate-50 text-slate-600 border-none"}>
                {stat.change}
              </Badge>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Trends */}
        <Card className="lg:col-span-2 p-8 border-none shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Tren Capaian Akademik</h3>
              <p className="text-sm text-slate-500">Perbandingan nilai rata-rata bulanan</p>
            </div>
            <select className="text-sm border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20">
              <option>Semua Mata Pelajaran</option>
              <option>Matematika</option>
              <option>Bahasa Inggris</option>
            </select>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2">
            {[45, 52, 48, 65, 78, 72, 85, 90, 88, 92].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div 
                  className="w-full bg-slate-100 rounded-t-lg transition-all group-hover:bg-emerald-500 relative cursor-pointer"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {height}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-slate-400">B0{i+1}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-8 border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Target size={120} />
          </div>
          <h3 className="text-xl font-bold mb-6 relative z-10">Siswa Berprestasi</h3>
          <div className="space-y-6 relative z-10">
            {[
              { name: "Ahmad Fadhil", class: "XII IPA 1", score: "98.5", rank: 1 },
              { name: "Siti Aminah", class: "XII IPA 3", score: "97.2", rank: 2 },
              { name: "Budi Santoso", class: "XI IPS 2", score: "96.8", rank: 3 },
              { name: "Diana Putri", class: "X IPA 5", score: "95.5", rank: 4 },
            ].map((siswa, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-amber-400 border border-white/5 group-hover:border-amber-400/50 transition-colors">
                    {siswa.rank}
                  </div>
                  <div>
                    <p className="font-bold text-sm group-hover:text-amber-300 transition-colors">{siswa.name}</p>
                    <p className="text-xs text-slate-400">{siswa.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400">{siswa.score}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Avg Score</p>
                </div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-8 bg-white/10 hover:bg-white/20 border-white/5 text-white gap-2 py-6 rounded-2xl">
            Lihat Semua Peringkat <ChevronRight size={16} />
          </Button>
        </Card>
      </div>

      {/* Actionable Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-l-4 border-l-amber-500 border-none shadow-sm bg-white">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Perhatian: Penurunan Kehadiran</h4>
              <p className="text-sm text-slate-600 mt-1">Ditemukan penurunan 4% kehadiran di Kelas XI IPS selama minggu terakhir. Disarankan untuk memantau laporan wali kelas.</p>
              <Button variant="link" className="text-amber-600 p-0 h-auto mt-2 font-bold text-xs">LIHAT DETAIL</Button>
            </div>
          </div>
        </Card>
        <Card className="p-6 border-l-4 border-l-indigo-500 border-none shadow-sm bg-white">
          <div className="flex gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Calendar size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900">Persiapan Ujian Akhir</h4>
              <p className="text-sm text-slate-600 mt-1">Ujian Akhir Semester Genap akan dimulai dalam 14 hari. 85% mata pelajaran telah menyelesaikan input kisi-kisi.</p>
              <Button variant="link" className="text-indigo-600 p-0 h-auto mt-2 font-bold text-xs">PANTAU KESIAPAN</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
