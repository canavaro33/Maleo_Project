import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maleo SIAKAD — Sistem Informasi Akademik",
  description:
    "Sistem Informasi Akademik Sekolah — Kelola data siswa, guru, jadwal, kehadiran, dan nilai secara digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">{children}</body>
    </html>
  );
}
