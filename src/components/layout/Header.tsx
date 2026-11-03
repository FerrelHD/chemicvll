'use client';

import React from 'react';
import { Menu, Search, Bell, Eye, EyeOff } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';

interface HeaderProps {
  onOpenMobileMenu?: () => void;
  onOpenCommandBar?: () => void;
}

export function Header({ onOpenMobileMenu, onOpenCommandBar }: HeaderProps) {
  const isPrivacyMode = useFinanceStore((state) => state.isPrivacyMode);
  const togglePrivacyMode = useFinanceStore((state) => state.togglePrivacyMode);

  const triggerCommand = () => {
    if (onOpenCommandBar) {
      onOpenCommandBar();
    } else {
      window.dispatchEvent(new CustomEvent('open-command-bar'));
    }
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline/70 z-30 flex items-center justify-between px-4 md:px-6 shadow-[0_1px_8px_rgba(24,24,27,0.03)]">
      {/* Left section: Hamburger (Mobile) + Search Bar (⌘K) */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Menu"
          onClick={onOpenMobileMenu}
          className="lg:hidden w-9 h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* ⌘K Capsule Input */}
        <button
          type="button"
          onClick={triggerCommand}
          className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-4 py-1.5 rounded-full border border-outline shadow-sm hover:border-zinc-400 transition cursor-pointer text-left"
        >
          <Search className="w-3.5 h-3.5 text-on-surface-variant" />
          <span className="text-xs text-on-surface-variant pr-4">
            Cari sistem, berkas, perintah...
          </span>
          <kbd className="bg-surface-container-high text-on-surface text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right section: Privacy Toggle + Cloud Sync + Notif + Avatar Ferrel */}
      <div className="flex items-center gap-2.5">
        {/* Privacy Sensor Mode Toggle Pill */}
        <button
          type="button"
          onClick={togglePrivacyMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm text-xs transition cursor-pointer ${
            isPrivacyMode
              ? 'bg-primary-fixed/40 border-primary/40 text-on-surface hover:bg-primary-fixed/60'
              : 'bg-surface-container-lowest border-outline text-on-surface-variant hover:bg-surface-container-high'
          }`}
          title={isPrivacyMode ? 'Sensor Saldo Aktif (Klik untuk tampilkan saldo)' : 'Saldo Terbuka (Klik untuk sensor saldo)'}
        >
          {isPrivacyMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-xs text-on-surface">Sensor</span>
              <span className="text-[10px] text-primary hidden md:inline font-mono font-bold">ON</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
              <span className="font-semibold text-xs text-on-surface">Sensor</span>
              <span className="text-[10px] text-on-surface-variant hidden md:inline font-mono font-bold">OFF</span>
            </>
          )}
        </button>

        {/* Cloud Sync Status Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-full border border-outline shadow-sm text-xs">
          <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></div>
          <span className="font-semibold text-on-surface text-xs">Cloud Sync</span>
          <span className="text-on-surface-variant hidden md:inline text-[11px]">Aktif</span>
        </div>

        {/* Notifications Icon Button */}
        <button
          type="button"
          aria-label="Notifikasi"
          onClick={() => alert('Tidak ada notifikasi baru.')}
          className="w-9 h-9 rounded-full bg-surface-container-lowest border border-outline flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors shadow-sm"
        >
          <Bell className="w-4 h-4 text-on-surface-variant" />
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-1">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shadow-sm">
            F
          </div>
          <span className="text-xs font-semibold text-on-surface hidden sm:inline">
            Ferrel
          </span>
        </div>
      </div>
    </header>
  );
}
