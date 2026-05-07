import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maleo SIAKAD — Sistem Informasi Akademik",
  description:
    "Sistem Informasi Akademik Sekolah — Kelola data siswa, guru, jadwal, kehadiran, dan nilai secara digital.",
};

import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Providers>
          <Toaster position="top-right" />
          {children}
        </Providers>
      </body>
    </html>
  );
}
