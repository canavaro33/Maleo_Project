"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/lib/axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import toast from "react-hot-toast";
import { Send, MessageCircle, ChevronLeft } from "lucide-react";

interface Teacher {
  id: number;
  name: string;
  subject?: { name: string };
  teacherCode?: string;
}

interface Consultation {
  id: number;
  senderId: number;
  senderRole: string;
  receiverId: number;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  replies?: Consultation[];
}

export default function KonsultasiPage() {
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedThread, setSelectedThread] = useState<Consultation | null>(null);
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [isNewThread, setIsNewThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Ambil daftar guru yang mengajar siswa ini
  const { data: teachers } = useQuery({
    queryKey: ["my-teachers"],
    queryFn: async () => {
      const res = await axios.get("/api/teachers/my-teachers");
      return res.data.data as Teacher[];
    },
  });

  // Ambil inbox konsultasi
  const { data: inbox } = useQuery({
    queryKey: ["consultations-inbox"],
    queryFn: async () => {
      const res = await axios.get("/api/consultations/inbox");
      return res.data.data as Consultation[];
    },
    refetchInterval: 30000, // polling setiap 30 detik
  });

  // Ambil unread count
  const { data: unreadCount } = useQuery({
    queryKey: ["consultations-unread"],
    queryFn: async () => {
      const res = await axios.get("/api/consultations/unread-count");
      return res.data.count as number;
    },
    refetchInterval: 30000,
  });

  // Ambil detail thread
  const { data: threadDetail } = useQuery({
    queryKey: ["consultation-thread", selectedThread?.id],
    queryFn: async () => {
      if (!selectedThread) return null;
      const res = await axios.get(`/api/consultations/${selectedThread.id}`);
      return res.data.data as Consultation;
    },
    enabled: !!selectedThread,
  });

  const sendMutation = useMutation({
    mutationFn: (data: any) => axios.post("/api/consultations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["consultations-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["consultation-thread"] });
      queryClient.invalidateQueries({ queryKey: ["consultations-unread"] });
      setMessage("");
      setSubject("");
      setIsNewThread(false);
      toast.success("Pesan berhasil dikirim");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Gagal mengirim pesan");
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;

    const payload: any = {
      receiverId: selectedTeacher?.id || selectedThread?.receiverId,
      receiverRole: "teacher",
      message: message.trim(),
    };

    if (isNewThread) {
      payload.subject = subject.trim() || "Konsultasi Baru";
    } else if (selectedThread) {
      payload.parentId = selectedThread.id;
      payload.subject = selectedThread.subject;
    }

    sendMutation.mutate(payload);
  };

  // Auto scroll ke bawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [threadDetail?.replies]);

  // Tampilkan daftar guru / thread
  const showList = !selectedThread && !isNewThread;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {/* Sidebar — Daftar Guru / Thread */}
      <div className={`w-full md:w-80 border-r bg-white flex flex-col ${!showList ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">Konsultasi</h2>
          {unreadCount ? (
            <Badge variant="danger" className="mt-1">
              {unreadCount} pesan belum dibaca
            </Badge>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Section: Riwayat Konsultasi */}
          {inbox && inbox.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-gray-500 mb-2">RIWAYAT</p>
              {inbox.map((thread) => (
                <div
                  key={thread.id}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-1 ${
                    !thread.isRead ? "bg-blue-50 border-l-2 border-blue-500" : ""
                  }`}
                  onClick={() => {
                    setSelectedThread(thread);
                    setSelectedTeacher(null);
                    setIsNewThread(false);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm truncate">{thread.subject}</p>
                    {!thread.isRead && (
                      <Badge variant="info" className="text-[10px]">Baru</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{thread.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(thread.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Section: Guru Tersedia */}
          <div className="p-3">
            <p className="text-xs font-medium text-gray-500 mb-2">GURU</p>
            {teachers?.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-1"
                onClick={() => {
                  setSelectedTeacher(teacher);
                  setSelectedThread(null);
                  setIsNewThread(true);
                  setSubject("");
                }}
              >
                <Avatar name={teacher.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{teacher.name}</p>
                  <p className="text-xs text-gray-500">
                    {teacher.subject?.name || "Guru"}
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-gray-50 ${showList ? 'hidden md:flex' : ''}`}>
        {isNewThread && selectedTeacher ? (
          // Form pesan baru
          <>
            <div className="p-4 bg-white border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsNewThread(false)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Avatar name={selectedTeacher.name} size="sm" />
              <div>
                <p className="font-medium text-sm">{selectedTeacher.name}</p>
                <p className="text-xs text-gray-500">Konsultasi Baru</p>
              </div>
            </div>

            <div className="flex-1 p-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <Input
                  placeholder="Subjek konsultasi..."
                  value={subject}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                  className="mb-3"
                />
                <textarea
                  placeholder="Tulis pertanyaan atau pesan Anda di sini..."
                  value={message}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 bg-white border-t">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMutation.isPending ? "Mengirim..." : "Kirim Pesan"}
              </Button>
            </div>
          </>
        ) : selectedThread ? (
          // Thread aktif
          <>
            <div className="p-4 bg-white border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSelectedThread(null)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <p className="font-medium text-sm">{selectedThread.subject}</p>
                <p className="text-xs text-gray-500">
                  {selectedThread.isRead ? "Sudah dibaca" : "Belum dibaca"}
                </p>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Pesan utama */}
                <div className="flex gap-3">
                  <Avatar name="Student" size="sm" />
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm">{selectedThread.message}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {new Date(selectedThread.createdAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                {/* Replies */}
                {threadDetail?.replies?.map((reply) => (
                  <div
                    key={reply.id}
                    className={`flex gap-3 ${
                      reply.senderRole === "teacher" ? "" : "flex-row-reverse"
                    }`}
                  >
                    <Avatar
                      name={reply.senderRole === "teacher" ? "Teacher" : "Student"}
                      size="sm"
                    />
                    <div className={`flex-1 ${reply.senderRole === "teacher" ? "" : "text-right"}`}>
                      <div
                        className={`rounded-lg p-3 shadow-sm inline-block ${
                          reply.senderRole === "teacher"
                            ? "bg-white"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        <p className="text-sm">{reply.message}</p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(reply.createdAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white border-t flex gap-2">
              <Input
                placeholder="Balas pesan..."
                value={message}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && handleSend()}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSend}
                disabled={!message.trim() || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Pilih guru untuk memulai konsultasi</p>
              <p className="text-sm text-gray-400">atau lihat riwayat konsultasi Anda</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
