'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Wallet,
  Terminal,
  CloudUpload,
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
  const [isHovered, setIsHovered] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'career', label: 'Career Pipeline', icon: Briefcase },
    { id: 'tasks', label: 'Tasks & Focus', icon: CheckCircle2 },
    { id: 'finance', label: 'Financial Vault', icon: Wallet },
    { id: 'dev', label: 'Dev Control', icon: Terminal },
    { id: 'dropzone', label: 'Dropzone Vault', icon: CloudUpload },
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

      {/* Modern Motion Collapsible Sidebar */}
      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{
          width: isHovered ? 260 : 72,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 h-full bg-surface-container-lowest border-r border-outline shadow-[0_2px_16px_rgba(24,24,27,0.04)] z-50 flex flex-col justify-between p-3 transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-6">
          {/* Brand Header */}
          <div className="flex items-center justify-between px-2 py-1 overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-container flex-shrink-0 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                P
              </div>
              <motion.div
                animate={{
                  opacity: isHovered || isOpenMobile ? 1 : 0,
                  display: isHovered || isOpenMobile ? 'flex' : 'none',
                }}
                transition={{ duration: 0.15 }}
                className="flex-col leading-tight whitespace-nowrap"
              >
                <span className="font-bold text-sm text-on-surface tracking-tight">
                  Personal OS
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  chemicv11
                </span>
              </motion.div>
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

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile?.();
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all text-left overflow-hidden ${
                    isActive
                      ? 'bg-inverse-surface text-white font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-medium'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <motion.span
                    animate={{
                      opacity: isHovered || isOpenMobile ? 1 : 0,
                      display: isHovered || isOpenMobile ? 'inline' : 'none',
                    }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Engine Widget */}
        <div className="flex flex-col gap-2 pt-4 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded-xl border border-outline shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-container animate-pulse flex-shrink-0"></div>
              <motion.span
                animate={{
                  opacity: isHovered || isOpenMobile ? 1 : 0,
                  display: isHovered || isOpenMobile ? 'inline' : 'none',
                }}
                transition={{ duration: 0.15 }}
                className="text-xs font-semibold text-on-surface whitespace-nowrap"
              >
                Personal Engine
              </motion.span>
            </div>
            <motion.span
              animate={{
                opacity: isHovered || isOpenMobile ? 1 : 0,
                display: isHovered || isOpenMobile ? 'inline' : 'none',
              }}
              transition={{ duration: 0.15 }}
              className="text-[10px] font-mono text-on-surface-variant"
            >
              v1.8.4
            </motion.span>
          </div>
        </div>
      </motion.aside>
    </>
  );
}
