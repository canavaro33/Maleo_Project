"use client";

import React, { useState } from "react";
import { Search, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { scores, grades, subjects } from "@/lib/mock-data";

const typeColors: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  Tugas: "info",
  Kuis: "neutral",
  UTS: "warning",
  UAS: "danger",
};

function getScoreColor(score: number) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-600";
}

export default function ScoresPage() {
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterType, setFilterType] = useState("");

  const filtered = scores.filter((s) => {
    const matchSearch = s.studentName.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade ? s.gradeName === filterGrade : true;
    const matchSubject = filterSubject ? s.subjectName === filterSubject : true;
    const matchType = filterType ? s.type === filterType : true;
    return matchSearch && matchGrade && matchSubject && matchType;
  });

  const avgScore = filtered.length ? (filtered.reduce((sum, s) => sum + s.score, 0) / filtered.length).toFixed(1) : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rekap Nilai</h1>
          <p className="text-sm text-muted-foreground mt-1">Kelola dan pantau nilai siswa</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm"><Download size={16} />Export</Button>
        </div>
      </div>

      {/* Avg Card */}
      <div className="flex items-center gap-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50 w-fit">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25">{avgScore}</div>
        <div><p className="text-sm font-semibold text-indigo-700">Rata-rata Nilai</p><p className="text-xs text-indigo-600">Dari {filtered.length} entri</p></div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1"><Input placeholder="Cari nama siswa..." icon={<Search size={16} />} value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div className="w-36"><Select placeholder="Semua Kelas" options={grades.map(g => ({value: g.name, label: g.name}))} value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} /></div>
          <div className="w-44"><Select placeholder="Semua Mapel" options={subjects.map(s => ({value: s.name, label: s.name}))} value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} /></div>
          <div className="w-36"><Select placeholder="Semua Tipe" options={[{value:"Tugas",label:"Tugas"},{value:"Kuis",label:"Kuis"},{value:"UTS",label:"UTS"},{value:"UAS",label:"UAS"}]} value={filterType} onChange={(e) => setFilterType(e.target.value)} /></div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">No</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Siswa</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Kelas</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Mapel</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tipe</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nilai</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((score, i) => (
                <tr key={score.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={score.studentName} size="sm" />
                      <span className="font-medium text-foreground">{score.studentName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4"><Badge variant="info">{score.gradeName}</Badge></td>
                  <td className="py-3 px-4 text-foreground">{score.subjectName}</td>
                  <td className="py-3 px-4"><Badge variant={typeColors[score.type] || "neutral"}>{score.type}</Badge></td>
                  <td className="py-3 px-4">
                    <span className={`text-lg font-bold ${getScoreColor(score.score)}`}>{score.score}</span>
                    <span className="text-xs text-muted-foreground">/{score.maxScore}</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{new Date(score.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
