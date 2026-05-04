"use client";

import React, { useState } from "react";
import { ClipboardCheck, Users, Calendar, Save, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export default function TeacherAttendancePage() {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Presensi Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">Rekap kehadiran siswa sesuai jadwal mengajar Anda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4 h-fit">
          <h3 className="font-bold flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" /> Filter Absensi
          </h3>
          <Input 
            label="Tanggal" 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
          />
          <Select label="Pilih Jadwal/Kelas" options={[]} placeholder="Pilih jadwal..." />
          <Button className="w-full">Tampilkan Daftar</Button>
        </Card>

        <Card className="p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Daftar Kehadiran Siswa</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Hadir
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Izin
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Sakit
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> Alpa
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nama Siswa</th>
                  <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-64">Status Kehadiran</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Keterangan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={3} className="py-32 text-center text-muted-foreground border-2 border-dashed border-border rounded-xl mt-4">
                    <div className="flex flex-col items-center gap-3">
                      <ClipboardCheck size={48} className="opacity-10" />
                      <p>Silakan pilih jadwal mengajar untuk melakukan presensi.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-border">
            <Button disabled>
              <Save size={16} />
              Simpan Presensi
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
