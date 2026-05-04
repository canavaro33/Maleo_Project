"use client";

import React, { useState, useEffect } from "react";
import { Plus, BookOpen, FileText, ExternalLink, Trash2, Loader2, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/apiService";

export default function TeacherContentsPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role);
      } catch (e) {
        console.error("Failed to parse user data");
      }
    }

    const fetchContents = async () => {
      try {
        const response = await apiService.getAll("/hub/contents");
        setContents(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, []);

  const isTeacher = userRole === "teacher";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Materi Pembelajaran</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher 
              ? "Kelola materi ajar, modul, dan referensi siswa" 
              : "Daftar materi ajar dan modul dari Guru Anda"}
          </p>
        </div>
        {isTeacher && (
          <Button size="sm">
            <Plus size={16} />
            Unggah Materi
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin mb-2" />
            <p>Memuat materi...</p>
          </div>
        ) : contents.length > 0 ? (
          contents.map((content) => (
            <Card key={content.id} className="p-0 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  {isTeacher && (
                    <button className="text-muted-foreground hover:text-red-600 p-1">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <h3 className="font-bold text-foreground mb-1 line-clamp-1">{content.title}</h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {content.subject?.name} • {content.class?.name}
                </p>
                
                {!isTeacher && (
                  <div className="flex items-center gap-2 mb-4 text-[11px] text-muted-foreground font-medium">
                    <User size={12} className="text-indigo-500" />
                    <span>Oleh: {content.teacher?.name}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 py-0.5 rounded bg-muted">
                    {content.type}
                  </span>
                  <a 
                    href={content.url} 
                    target="_blank" 
                    className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
                  >
                    {isTeacher ? "Buka" : "Lihat Materi"} <ExternalLink size={12} />
                  </a>
                </div>
              </div>
              <div className="h-1 w-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-3xl">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <FileText size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {isTeacher ? "Belum Ada Materi" : "Materi Belum Tersedia"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              {isTeacher 
                ? "Anda belum mengunggah materi apapun. Klik tombol \"Unggah Materi\" untuk memulai." 
                : "Belum ada materi pembelajaran untuk kelas Anda."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
