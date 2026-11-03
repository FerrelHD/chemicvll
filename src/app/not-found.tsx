import React from 'react';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-on-surface selection:bg-primary-fixed selection:text-on-primary-fixed-variant">
      <div className="max-w-md w-full bg-surface-container-lowest rounded-3xl p-8 border border-outline shadow-bento text-center flex flex-col items-center gap-5">
        
        {/* Brand Chip */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-fixed text-primary-container text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
          <span>Status 404</span>
        </div>

        {/* Big Code */}
        <div className="space-y-1">
          <h1 className="text-6xl font-extrabold tracking-tight font-sans text-on-surface">
            404
          </h1>
          <h2 className="text-base font-bold text-on-surface">
            Halaman Tidak Ditemukan
          </h2>
        </div>

        <p className="text-xs text-on-surface-variant leading-relaxed">
          Rute atau modul yang Anda tuju tidak tersedia atau telah dipindahkan ke direktori lain dalam Personal OS.
        </p>

        {/* Action Button */}
        <div className="pt-2 w-full">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Kembali ke Dashboard Utama</span>
          </Link>
        </div>

        {/* Footer label */}
        <span className="text-[11px] text-on-surface-variant font-mono">
          Personal OS · chemicv11
        </span>
      </div>
    </div>
  );
}
