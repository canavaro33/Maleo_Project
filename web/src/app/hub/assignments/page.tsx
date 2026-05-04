"use client";

import React, { useState, useEffect } from "react";
import { Plus, ClipboardList, Calendar, Trash2, Loader2, Users, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";
import { formatDate } from "@/lib/utils";

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    const fetchAssignments = async () => {
      try {
        const response = await apiService.getAll("/hub/assignments");
        setAssignments(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const isTeacher = userRole === "teacher";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tugas Siswa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher 
              ? "Kelola tugas, deadline, dan pengumpulan karya siswa" 
              : "Daftar tugas yang harus Anda kerjakan"}
          </p>
        </div>
        {isTeacher && (
          <Button size="sm">
            <Plus size={16} />
            Buat Tugas Baru
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin mb-2" />
            <p>Memuat daftar tugas...</p>
          </div>
        ) : assignments.length > 0 ? (
          assignments.map((assignment) => (
            <Card key={assignment.id} className="p-0 overflow-hidden hover:border-indigo-200 transition-colors shadow-sm">
              <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${isTeacher ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{assignment.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                        {assignment.subject?.name}
                      </span>
                      {isTeacher ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users size={12} /> {assignment.class?.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <User size={12} /> {assignment.teacher?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col items-end">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tenggat Waktu</p>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-rose-600">
                      <Calendar size={14} />
                      {formatDate(assignment.dueDate)}
                    </div>
                  </div>
                  <div className="h-10 w-px bg-border hidden md:block"></div>
                  <div className="flex gap-2">
                    <Button variant={isTeacher ? "secondary" : "primary"} size="sm">
                      {isTeacher ? "Lihat Jawaban" : "Kerjakan Tugas"}
                    </Button>
                    {isTeacher && (
                      <button className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="py-20 text-center border-2 border-dashed border-border rounded-3xl bg-card">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <ClipboardList size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {isTeacher ? "Belum Ada Tugas" : "Tugas Belum Tersedia"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              {isTeacher 
                ? "Daftar tugas yang Anda buat akan muncul di sini. Mari mulai dengan membuat satu tugas!" 
                : "Belum ada tugas yang diberikan untuk kelas Anda."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
