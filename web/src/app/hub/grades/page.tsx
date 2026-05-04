"use client";

import React, { useState } from "react";
import { Award, Search, Save, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";

export default function TeacherGradesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Penilaian Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">Input dan kelola nilai tugas, UTS, serta UAS siswa</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Select label="Pilih Kelas" options={[]} placeholder="Pilih kelas..." />
          <Select label="Mata Pelajaran" options={[]} placeholder="Pilih mapel..." />
          <Select label="Jenis Penilaian" options={[{value:"Tugas",label:"Tugas"},{value:"UTS",label:"UTS"},{value:"UAS",label:"UAS"}]} placeholder="Pilih jenis..." />
        </div>

        <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-blue-700 text-sm">
          <Info size={18} />
          <p>Silakan pilih Kelas dan Mata Pelajaran terlebih dahulu untuk menampilkan daftar siswa.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground rounded-l-lg">No</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">NIS</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Nama Siswa</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-32">Nilai (0-100)</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground rounded-r-lg">Catatan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="py-20 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Award size={40} className="opacity-20" />
                    <p>Pilih filter di atas untuk memulai penilaian.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-6">
          <Button disabled>
            <Save size={16} />
            Simpan Semua Nilai
          </Button>
        </div>
      </Card>
    </div>
  );
}
