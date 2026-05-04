"use client";

import React, { useState, useEffect } from "react";
import { Clock, MapPin, Calendar, Loader2, RefreshCcw, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { apiService } from "@/services/apiService";

export default function TeacherSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll("/hub/schedules");
      setSchedules(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
    fetchSchedules();
  }, []);

  const isTeacher = userRole === "teacher";
  const days = isTeacher 
    ? ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
    : ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isTeacher ? "Jadwal Mengajar" : "Jadwal Pelajaran"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeacher 
              ? "Seluruh jadwal mengajar Anda dalam satu minggu" 
              : "Jadwal mata pelajaran kelas Anda selama satu minggu"}
          </p>
        </div>
        <button onClick={fetchSchedules} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="animate-spin mb-2" />
          <p>Memuat jadwal...</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${isTeacher ? "lg:grid-cols-3" : "xl:grid-cols-5"} gap-6`}>
          {days.map((day) => {
            const daySchedules = schedules.filter((s) => s.day === day);
            return (
              <Card key={day} className="p-0 overflow-hidden border-t-4 border-t-indigo-500 shadow-sm flex flex-col">
                <div className="px-6 py-4 bg-muted/30 border-b border-border">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" /> {day}
                  </h3>
                </div>
                <div className="p-4 space-y-3 flex-1">
                  {daySchedules.length > 0 ? (
                    daySchedules.map((s) => (
                      <div key={s.id} className="p-4 rounded-xl bg-background border border-border/60 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{s.startTime} - {s.endTime}</span>
                          <span className="text-[10px] font-bold text-muted-foreground px-2 py-0.5 bg-muted rounded uppercase">
                            {isTeacher ? s.class?.name : "Rutin"}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm mb-2 group-hover:text-indigo-600 transition-colors">{s.subject?.name}</h4>
                        <div className="space-y-1.5">
                          {!isTeacher && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <User size={12} className="text-indigo-400" />
                              <span className="truncate">{s.teacher?.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin size={12} className="text-indigo-400" />
                            <span>{s.room}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center text-xs text-muted-foreground italic">
                      {isTeacher ? "Tidak ada jadwal mengajar" : "Tidak ada jadwal pelajaran"}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
