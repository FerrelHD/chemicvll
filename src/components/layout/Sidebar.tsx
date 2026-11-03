'use client';

import React from 'react';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Wallet,
  Terminal,
  CloudUpload,
  Sliders,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  onTabChange,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
    { id: 'career', label: 'Karir & Magang', icon: Briefcase },
    { id: 'tasks', label: 'Tugas & Fokus', icon: CheckCircle2 },
    { id: 'finance', label: 'Keuangan', icon: Wallet },
    { id: 'dev', label: 'Dev Server', icon: Terminal },
    { id: 'dropzone', label: 'Dropzone', icon: CloudUpload },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Persistent Left Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline shadow-[0_1px_8px_rgba(24,24,27,0.04)] z-50 flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shadow-sm">
                P
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-sm text-on-surface tracking-tight">
                  Personal OS
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  chemicv11
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-full text-on-surface-variant hover:bg-surface-container-high"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items (Pill Style) */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all text-left ${
                    isActive
                      ? 'bg-inverse-surface text-white font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Engine Widget */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-surface-container-low rounded-2xl border border-outline shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></div>
              <span className="text-xs font-semibold text-on-surface">
                Personal Engine
              </span>
            </div>
            <span className="text-[10px] font-mono text-on-surface-variant">
              v1.8.4
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

