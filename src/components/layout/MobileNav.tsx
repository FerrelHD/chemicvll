'use client';

import React from 'react';
import { LayoutDashboard, Briefcase, CheckCircle2, Wallet, Terminal, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickCapture?: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenQuickCapture }: MobileNavProps) {
  const leftTabs = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'career', label: 'Career', icon: Briefcase },
  ];

  const rightTabs = [
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
    { id: 'finance', label: 'Vault', icon: Wallet },
    { id: 'dev', label: 'Dev', icon: Terminal },
  ];

  const handleQuickAction = () => {
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-capture'));
    }
  };

  const renderTabButton = (tab: { id: string; label: string; icon: React.ElementType }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        className={`relative flex-1 min-h-[46px] flex flex-col items-center justify-center gap-0.5 py-1 px-0.5 rounded-full transition-colors select-none ${
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
  };

  return (
    <div className="md:hidden fixed bottom-4 inset-x-0 z-40 flex justify-center pointer-events-none px-3 pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto w-full max-w-sm sm:max-w-md bg-surface-container-lowest/90 backdrop-blur-2xl border border-outline/80 p-1.5 rounded-full shadow-[0_8px_32px_rgba(24,24,27,0.08)] flex items-center justify-between gap-1">
        {/* Left 2 Tabs */}
        {leftTabs.map(renderTabButton)}

        {/* Center Quick Action Floating Button (Chemicvll Orange Accent) */}
        <button
          type="button"
          aria-label="Quick Action"
          onClick={handleQuickAction}
          className="relative flex-shrink-0 w-10 h-10 -my-1 rounded-full bg-gradient-to-tr from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white shadow-md shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform select-none"
          title="Quick Capture (+)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Right 3 Tabs */}
        {rightTabs.map(renderTabButton)}
      </nav>
    </div>
  );
}
