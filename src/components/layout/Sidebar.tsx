'use client';

import React from 'react';
import {
  Sidebar as AcetSidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Briefcase,
  CheckCircle2,
  Wallet,
  Terminal,
  CloudUpload,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function Sidebar({
  activeTab,
  onTabChange,
  open,
  setOpen,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'career', label: 'Career Pipeline', icon: Briefcase },
    { id: 'tasks', label: 'Tasks & Focus', icon: CheckCircle2 },
    { id: 'finance', label: 'Financial Vault', icon: Wallet },
    { id: 'dev', label: 'Dev Control', icon: Terminal },
    { id: 'dropzone', label: 'Dropzone Vault', icon: CloudUpload },
  ];

  return (
    <AcetSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6 h-full">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Header */}
          <div
            className="flex items-center gap-3 px-1 py-1 cursor-pointer select-none"
            onClick={() => onTabChange('dashboard')}
          >
            <div className="w-8 h-8 rounded-xl bg-primary-container text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              P
            </div>
            <motion.div
              animate={{
                opacity: open ? 1 : 0,
                display: open ? 'flex' : 'none',
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

          {/* Navigation Links */}
          <div className="mt-8 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <SidebarLink
                  key={item.id}
                  link={{
                    label: item.label,
                    icon: (
                      <Icon
                        className={`w-4 h-4 transition-colors ${
                          isActive
                            ? 'text-primary-container font-bold'
                            : 'text-neutral-600 dark:text-neutral-400'
                        }`}
                      />
                    ),
                    onClick: () => {
                      onTabChange(item.id);
                      setOpen(false);
                    },
                    isActive,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* User Profile Avatar at Bottom */}
        <div className="pt-3 border-t border-outline/50">
          <SidebarLink
            link={{
              label: 'Ferrel HD',
              icon: (
                <div className="w-7 h-7 rounded-full bg-primary-container text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                  F
                </div>
              ),
              onClick: () => {
                onTabChange('dashboard');
                setOpen(false);
              },
            }}
          />
        </div>
      </SidebarBody>
    </AcetSidebar>
  );
}
