'use client';

import React from 'react';
import { LayoutDashboard, Briefcase, CheckCircle2, Wallet, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto w-full max-w-sm bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline/80 p-1.5 rounded-full shadow-[0_8px_32px_rgba(24,24,27,0.08)] flex items-center justify-between gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 min-h-[46px] flex flex-col items-center justify-center gap-0.5 py-1 px-1 rounded-full transition-colors select-none ${
                isActive
                  ? 'text-primary-container font-semibold'
                  : 'text-on-surface-variant hover:text-on-surface font-normal'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="mobileNavPill"
                  className="absolute inset-0 bg-primary-fixed/50 rounded-full border border-primary-container/20 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${
                  isActive ? 'scale-110 text-primary-container' : 'text-on-surface-variant'
                }`}
              />
              <span className="text-[10px] tracking-tight leading-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
