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
import { LayoutGrid, ChevronUp } from 'lucide-react';

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
  const isSecondaryActive = Boolean(activeMoreTab);

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
    <div className="md:hidden fixed bottom-3 sm:bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-2.5 sm:px-4 pb-[env(safe-area-inset-bottom,0px)]">
      {/* Tap-dismiss backdrop when Popover is open */}
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-30 pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* Popover sheet for all secondary modules */}
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            ref={moreRef}
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto absolute bottom-[calc(100%+0.75rem)] right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 bg-surface-container-lowest/98 backdrop-blur-xl border border-outline/50 shadow-2xl rounded-3xl p-2.5 flex flex-col gap-1 min-w-[220px] max-w-[calc(100vw-2rem)] max-h-[60dvh] overflow-y-auto z-40"
          >
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-outline/20">
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                Modul Lainnya
              </span>
              <span className="text-[10px] text-on-surface-variant">Pilih menu</span>
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
                  className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-left transition ${
                    isSelected
                      ? 'bg-primary-fixed text-on-surface border border-primary-container/30 shadow-xs'
                      : 'text-on-surface hover:bg-surface-container-high'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TabIcon active={isSelected} className="w-4 h-4 text-primary-container shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container shrink-0" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="relative z-40 pointer-events-auto w-full max-w-[360px] sm:max-w-[400px] bg-surface-container-lowest/95 backdrop-blur-md border border-outline/60 px-2 py-1.5 rounded-[28px] shadow-[0_12px_36px_rgba(24,24,27,0.10),0_2px_8px_rgba(24,24,27,0.04)] flex items-center justify-between gap-1">
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
          className="relative flex-shrink-0 w-11 h-11 mx-0.5 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white shadow-md flex items-center justify-center active:scale-90 transition-all select-none ring-4 ring-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
          title="Quick Capture"
        >
          <QuickCaptureMark className="w-5 h-5" />
        </button>

        {/* Right Tab 1: Vault (Finance) */}
        {renderTabButton({ id: 'finance', label: 'Vault', icon: VaultMark }, () => setIsMoreOpen(false))}

        {/* Right Tab 2: Thumb-friendly 4th Slot (Active secondary tab OR More menu trigger) */}
        <button
          type="button"
          aria-label="More modules"
          aria-expanded={isMoreOpen}
          onClick={() => setIsMoreOpen((prev) => !prev)}
          className={`relative flex-1 min-h-[48px] flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-full transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
            isSecondaryActive
              ? 'text-on-surface font-semibold'
              : 'text-on-surface-variant hover:text-on-surface font-normal'
          }`}
        >
          {isSecondaryActive && (
            <motion.div
              layoutId="mobileNavPill"
              className="absolute inset-0 bg-primary-fixed/45 rounded-full border border-primary-container/25 -z-10"
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            />
          )}

          {isSecondaryActive && activeMoreTab ? (
            <activeMoreTab.icon
              active={true}
              className="w-[18px] h-[18px] scale-105 text-on-surface"
            />
          ) : (
            <LayoutGrid className="w-[18px] h-[18px] text-on-surface-variant transition-transform active:scale-90" />
          )}

          <div className="flex items-center gap-0.5 leading-none">
            <span className="text-[10px] sm:text-[11px] tracking-tight truncate max-w-[46px]">
              {isSecondaryActive && activeMoreTab ? activeMoreTab.label : 'More'}
            </span>
            <ChevronUp
              className={`w-2.5 h-2.5 text-on-surface-variant transition-transform duration-200 ${
                isMoreOpen ? 'rotate-180' : ''
              }`}
            />
          </div>
        </button>
      </nav>
    </div>
  );
}
