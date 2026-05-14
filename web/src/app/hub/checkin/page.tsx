"use client";
import React, { useState, useEffect } from "react";
import { apiService } from "@/services/apiService";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function TeacherCheckinPage() {
  const [todayStatus, setTodayStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ status: "hadir", note: "" });

  useEffect(() => {
    fetchTodayStatus();
    const interval = setInterval(fetchTodayStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const res = await apiService.getAll("/teacher-attendances/today");
      setTodayStatus(res.data);
    } catch (error) {
      console.error("Gagal mengambil status kehadiran:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async () => {
    if (form.status !== 'hadir' && !form.note) {
      alert("Keterangan wajib diisi untuk Izin/Sakit");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await apiService.create("/teacher-attendances/checkin", form);
      fetchTodayStatus();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Memuat status kehadiran...</div>;
  }

  if (!todayStatus) {
    return (
      <div className="p-6 text-center text-rose-500 font-medium">
        Gagal memuat status kehadiran. Pastikan data guru Anda valid atau muat ulang halaman.
      </div>
    );
  }

  const { hasCheckedIn, attendance, isWindowOpen, windowMessage, currentTime } = todayStatus;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kehadiran Hari Ini</h1>
          <p className="text-muted-foreground">{new Date(currentTime).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-lg">
          <Clock size={18} className="text-indigo-600" />
          <span className="font-mono text-lg font-bold">{new Date(currentTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {hasCheckedIn ? (
        <Card className="border-emerald-200 shadow-emerald-100 shadow-md">
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-800">Anda sudah melakukan check-in</h2>
              <p className="text-slate-500 mt-1">Terima kasih telah mengonfirmasi kehadiran Anda.</p>
            </div>
            
            <div className="w-full max-w-sm mt-4 bg-slate-50 rounded-lg p-4 text-left space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-slate-500">Status</span>
                <Badge
                  className={
                    attendance.status === 'hadir' ? 'bg-emerald-500 hover:bg-emerald-600' :
                    attendance.status === 'terlambat' ? 'bg-amber-500 hover:bg-amber-600' :
                    attendance.status === 'izin' ? 'bg-blue-500 hover:bg-blue-600' :
                    attendance.status === 'sakit' ? 'bg-yellow-500 hover:bg-yellow-600 text-black' :
                    'bg-rose-500 hover:bg-rose-600'
                  }
                >
                  {attendance.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm text-slate-500">Jam Masuk</span>
                <span className="font-medium">
                  {attendance.checkinAt ? new Date(attendance.checkinAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                </span>
              </div>
              {attendance.isLate && (
                <div className="flex justify-between items-center border-b pb-2 text-amber-600">
                  <span className="text-sm">Keterlambatan</span>
                  <span className="font-medium text-sm">{attendance.lateMinutes} menit</span>
                </div>
              )}
              {attendance.note && (
                <div>
                  <span className="text-sm text-slate-500 block mb-1">Keterangan</span>
                  <p className="text-sm font-medium">{attendance.note}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="shadow-md">
          <div className="p-6 pt-6">
            {!isWindowOpen && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold">Perhatian</h3>
                  <p className="text-sm">{windowMessage}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Pilih Status Kehadiran</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    disabled={!isWindowOpen}
                    onClick={() => setForm({ ...form, status: 'hadir' })}
                    className={`py-3 rounded-lg font-medium transition-colors border-2 ${
                      form.status === 'hadir' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    } ${!isWindowOpen && 'opacity-50 cursor-not-allowed'}`}
                  >
                    Hadir
                  </button>
                  <button
                    onClick={() => setForm({ ...form, status: 'izin' })}
                    className={`py-3 rounded-lg font-medium transition-colors border-2 ${
                      form.status === 'izin' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Izin
                  </button>
                  <button
                    onClick={() => setForm({ ...form, status: 'sakit' })}
                    className={`py-3 rounded-lg font-medium transition-colors border-2 ${
                      form.status === 'sakit' 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    Sakit
                  </button>
                </div>
              </div>

              {(form.status === 'izin' || form.status === 'sakit') && (
                <div>
                  <label className="block text-sm font-medium mb-2">Keterangan (Wajib)</label>
                  <textarea
                    required
                    rows={3}
                    className="w-full border p-3 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Tuliskan keterangan detail..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  ></textarea>
                </div>
              )}

              <button
                onClick={handleCheckin}
                disabled={isSubmitting || (!isWindowOpen && form.status === 'hadir') || ((form.status === 'izin' || form.status === 'sakit') && !form.note.trim())}
                className="w-full py-4 rounded-lg bg-indigo-600 text-white font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Memproses..." : "Konfirmasi Kehadiran"}
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
