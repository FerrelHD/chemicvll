'use client';

import React from 'react';
import { LayoutDashboard, Briefcase, CheckCircle2, Wallet, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickCapture?: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenQuickCapture }: MobileNavProps) {
  const leftTabs = [
    { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  ];

  const rightTabs = [
    { id: 'finance', label: 'Vault', icon: Wallet },
    { id: 'career', label: 'Career', icon: Briefcase },
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
        className={`relative flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-full transition-colors select-none ${
          isActive
            ? 'text-primary-container font-semibold'
            : 'text-on-surface-variant hover:text-on-surface font-normal'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="mobileNavPill"
            className="absolute inset-0 bg-primary-fixed/40 rounded-full border border-primary-container/20 -z-10"
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />
        )}
        <Icon
          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-transform duration-200 ${
            isActive ? 'scale-110 text-primary-container' : 'text-on-surface-variant'
          }`}
        />
        <span className="text-[10px] sm:text-[11px] tracking-tight leading-none">
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="pointer-events-auto w-full max-w-[340px] sm:max-w-[380px] bg-surface-container-lowest/90 backdrop-blur-xl border border-outline/40 px-2 py-1.5 rounded-[28px] shadow-[0_12px_36px_rgba(24,24,27,0.10),0_2px_8px_rgba(24,24,27,0.04)] flex items-center justify-between gap-1">
        {/* Left 2 Tabs */}
        {leftTabs.map(renderTabButton)}

        {/* Center Quick Action Floating Button (Chemicvll Orange Accent + Ring Cutout) */}
        <button
          type="button"
          aria-label="Quick Action"
          onClick={handleQuickAction}
          className="relative flex-shrink-0 w-11 h-11 mx-0.5 rounded-full bg-gradient-to-tr from-primary to-orange-500 hover:from-primary/95 hover:to-orange-500/95 text-white shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-all select-none ring-4 ring-surface-container-lowest"
          title="Quick Capture (+)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Right 2 Tabs */}
        {rightTabs.map(renderTabButton)}
      </nav>
    </div>
  );
}
