'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CockpitMark,
  FocusMark,
  VaultMark,
  PipelineMark,
  ConsoleMark,
  RelayMark,
  LedgerNoteMark,
  QuickCaptureMark,
  ChemicIconProps,
} from '@/components/icons/ChemicIcons';
import { ChevronUp } from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickCapture?: () => void;
}

export function MobileNav({ activeTab, onTabChange, onOpenQuickCapture }: MobileNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMoreOpen]);

  const leftTabs: { id: string; label: string; icon: React.ComponentType<ChemicIconProps> }[] = [
    { id: 'dashboard', label: 'Dash', icon: CockpitMark },
    { id: 'tasks', label: 'Tasks', icon: FocusMark },
  ];

  const moreTabs: { id: string; label: string; icon: React.ComponentType<ChemicIconProps> }[] = [
    { id: 'career', label: 'Career', icon: PipelineMark },
    { id: 'dropzone', label: 'Dropzone', icon: RelayMark },
    { id: 'notes', label: 'Notes', icon: LedgerNoteMark },
    { id: 'dev', label: 'Dev Port', icon: ConsoleMark },
  ];

  const activeMoreTab = moreTabs.find((t) => t.id === activeTab);
  const currentFourthTab = activeMoreTab || moreTabs[0]; // defaults to Career

  const handleQuickAction = () => {
    if (onOpenQuickCapture) {
      onOpenQuickCapture();
    } else {
      window.dispatchEvent(new CustomEvent('open-quick-capture'));
    }
  };

  const renderTabButton = (
    tab: {
      id: string;
      label: string;
      icon: React.ComponentType<ChemicIconProps>;
    },
    onClickExtra?: () => void
  ) => {
    const Icon = tab.icon;
    const isActive = activeTab === tab.id;

    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => {
          onTabChange(tab.id);
          onClickExtra?.();
        }}
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
        <span className="text-[10px] sm:text-[11px] tracking-tight leading-none truncate max-w-[56px]">
          {tab.label}
        </span>
      </button>
    );
  };

  return (
    <div className="md:hidden fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Popover sheet for all secondary modules */}
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            ref={moreRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-auto absolute bottom-16 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-surface-container-lowest/95 backdrop-blur-md border border-outline/50 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 min-w-[200px]"
          >
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/20">
              Modul Lainnya
            </div>
            {moreTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onTabChange(tab.id);
                    setIsMoreOpen(false);
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                    isSelected
                      ? 'bg-primary-fixed/50 text-on-surface border border-primary-container/30'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <TabIcon active={isSelected} className="w-4 h-4 text-primary-container shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="pointer-events-auto w-full max-w-[340px] sm:max-w-[380px] bg-surface-container-lowest/95 backdrop-blur-md border border-outline/60 px-2 py-1.5 rounded-[28px] shadow-[0_12px_36px_rgba(24,24,27,0.10),0_2px_8px_rgba(24,24,27,0.04)] flex items-center justify-between gap-1">
        {/* Left 2 Tabs: Dash & Tasks */}
        {leftTabs.map((t) => renderTabButton(t, () => setIsMoreOpen(false)))}

        {/* Center Quick Action Charcoal Trigger */}
        <button
          type="button"
          aria-label="Quick Action"
          onClick={() => {
            setIsMoreOpen(false);
            handleQuickAction();
          }}
          className="relative flex-shrink-0 w-11 h-11 mx-0.5 rounded-full bg-inverse-surface hover:bg-black text-white shadow-md flex items-center justify-center active:scale-90 transition-all select-none ring-4 ring-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          title="Quick Capture"
        >
          <QuickCaptureMark className="w-5 h-5" />
        </button>

        {/* Right Tab 1: Vault (Finance) */}
        {renderTabButton({ id: 'finance', label: 'Vault', icon: VaultMark }, () => setIsMoreOpen(false))}

        {/* Right Tab 2: Dynamic 4th Module (Career / Notes / Dropzone / Dev) + More Trigger */}
        <div className="relative flex-1 flex items-center justify-center">
          {renderTabButton(currentFourthTab)}
          <button
            type="button"
            aria-label="More modules"
            onClick={(e) => {
              e.stopPropagation();
              setIsMoreOpen((prev) => !prev);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-surface-container border border-outline/40 flex items-center justify-center text-on-surface-variant hover:text-on-surface shadow-xs transition active:scale-90"
            title="Pilih modul lainnya"
          >
            <ChevronUp className={`w-3 h-3 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </nav>
    </div>
  );
}
