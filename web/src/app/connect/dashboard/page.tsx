"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Users, Award, ClipboardCheck, Megaphone } from "lucide-react";
import { students } from "@/lib/mock-data";

export default function ConnectDashboard() {
  // Mock data for guardian's children
  const myChildren = students.slice(0, 2);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Selamat datang di Maleo Connect — Pantau Perkembangan Akademik Anak Anda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <Users size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Anak</p>
              <h3 className="text-2xl font-bold text-foreground">{myChildren.length} Anak</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-100 text-orange-600">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rata-rata Kehadiran</p>
              <h3 className="text-2xl font-bold text-foreground">98%</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-rose-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-rose-100 text-rose-600">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</p>
              <h3 className="text-2xl font-bold text-foreground">86.4</h3>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-yellow-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-yellow-100 text-yellow-600">
              <Megaphone size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pengumuman Baru</p>
              <h3 className="text-2xl font-bold text-foreground">1</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 col-span-2">
          <h3 className="text-lg font-bold mb-4">Ringkasan Anak</h3>
          <div className="space-y-4">
            {myChildren.map((child) => (
              <div key={child.id} className="flex items-center justify-between p-4 rounded-xl border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{child.name}</h4>
                    <p className="text-sm text-muted-foreground">Kelas {child.gradeName} • {child.nis}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm">
                    <Award size={16} />
                    <span className="font-semibold">Nilai: 85</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Informasi Sekolah</h3>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <h4 className="font-semibold text-orange-900">Rapat Wali Murid</h4>
              <p className="text-sm text-orange-700 mt-1">Pengambilan rapot semester ganjil pada 20 Desember 2025.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
