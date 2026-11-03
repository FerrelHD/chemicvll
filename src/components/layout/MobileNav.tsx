'use client';

import React from 'react';
import { LayoutDashboard, Briefcase, CheckCircle2, Wallet, Terminal } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function MobileNav({ activeTab, onTabChange }: MobileNavProps) {
  const tabs = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'career', label: 'Career', icon: Briefcase },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'finance', label: 'Vault', icon: Wallet },
    { id: 'dev', label: 'Dev', icon: Terminal },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest/90 backdrop-blur-xl border-t border-outline px-2 py-1.5 flex items-center justify-around shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`min-h-[44px] min-w-[48px] flex flex-col items-center justify-center gap-1 px-2.5 py-1 rounded-full transition-all ${
              isActive
                ? 'bg-inverse-surface text-white font-semibold shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface font-normal'
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
