'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CockpitMark,
  FocusMark,
  VaultMark,
  PipelineMark,
  QuickCaptureMark,
  ChemicIconProps,
} from '@/components/icons/ChemicIcons';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickCapture?: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenQuickCapture }: MobileNavProps) {
  const leftTabs: { id: string; label: string; icon: React.ComponentType<ChemicIconProps> }[] = [
    { id: 'dashboard', label: 'Dash', icon: CockpitMark },
    { id: 'tasks', label: 'Tasks', icon: FocusMark },
  ];

  const rightTabs: { id: string; label: string; icon: React.ComponentType<ChemicIconProps> }[] = [
    { id: 'finance', label: 'Vault', icon: VaultMark },
    { id: 'career', label: 'Career', icon: PipelineMark },
  ];

  const handleQuickAction = () => {
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-capture'));
    }
  };

  const renderTabButton = (tab: {
    id: string;
    label: string;
    icon: React.ComponentType<ChemicIconProps>;
  }) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => onTabChange(tab.id)}
        className={`relative flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-full transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
          isActive
            ? 'text-on-surface font-semibold'
            : 'text-on-surface-variant hover:text-on-surface font-normal'
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="mobileNavPill"
            className="absolute inset-0 bg-primary-fixed/45 rounded-full border border-primary-container/25 -z-10"
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
          />
        )}
        <Icon
          active={isActive}
          className={`w-[18px] h-[18px] transition-transform duration-150 ${
            isActive ? 'scale-105 text-on-surface' : 'text-on-surface-variant'
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
      <nav className="pointer-events-auto w-full max-w-[340px] sm:max-w-[380px] bg-surface-container-lowest/95 backdrop-blur-md border border-outline/60 px-2 py-1.5 rounded-[28px] shadow-[0_12px_36px_rgba(24,24,27,0.10),0_2px_8px_rgba(24,24,27,0.04)] flex items-center justify-between gap-1">
        {/* Left 2 Tabs */}
        {leftTabs.map(renderTabButton)}

        {/* Center Quick Action Charcoal Trigger with Warm Citrus Core */}
        <button
          type="button"
          aria-label="Quick Action"
          onClick={handleQuickAction}
          className="relative flex-shrink-0 w-11 h-11 mx-0.5 rounded-full bg-inverse-surface hover:bg-black text-white shadow-md flex items-center justify-center active:scale-90 transition-all select-none ring-4 ring-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          title="Quick Capture"
        >
          <QuickCaptureMark className="w-5 h-5" />
        </button>

        {/* Right 2 Tabs */}
        {rightTabs.map(renderTabButton)}
      </nav>
    </div>
  );
}
