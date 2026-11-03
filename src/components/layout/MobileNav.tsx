'use client';

import React from 'react';
import { Briefcase, CheckSquare, Wallet, Terminal } from 'lucide-react';

interface MobileNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function MobileNav({ activeTab = 'career', onTabChange }: MobileNavProps) {
  const tabs = [
    { id: 'career', label: 'Karir', icon: Briefcase },
    { id: 'tasks', label: 'Tugas', icon: CheckSquare },
    { id: 'finance', label: 'Keuangan', icon: Wallet },
    { id: 'dev', label: 'Dev Server', icon: Terminal },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-lg border-t border-appleBorder px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange?.(tab.id)}
            className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition ${
              isActive
                ? 'text-[#0066CC] font-semibold'
                : 'text-appleText-muted hover:text-appleText-secondary font-normal'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

