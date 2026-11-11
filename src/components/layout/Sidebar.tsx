'use client';

import React from 'react';
import {
  Sidebar as AcetSidebar,
  SidebarBody,
  SidebarLink,
} from '@/components/ui/sidebar';
import {
  CockpitMark,
  PipelineMark,
  FocusMark,
  VaultMark,
  ConsoleMark,
  RelayMark,
  LedgerNoteMark,
  ChemicIconProps,
} from '@/components/icons/ChemicIcons';

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
  const navItems: {
    id: string;
    label: string;
    icon: React.ComponentType<ChemicIconProps>;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: CockpitMark },
    { id: 'career', label: 'Career Pipeline', icon: PipelineMark },
    { id: 'tasks', label: 'Tasks & Focus', icon: FocusMark },
    { id: 'finance', label: 'Financial Vault', icon: VaultMark },
    { id: 'dev', label: 'Dev Control', icon: ConsoleMark },
    { id: 'dropzone', label: 'Dropzone Vault', icon: RelayMark },
    { id: 'notes', label: 'Second Brain', icon: LedgerNoteMark },
  ];

  return (
    <AcetSidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6 h-full">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Logo Header */}
          <button
            type="button"
            className="flex items-center gap-3 px-1.5 py-1.5 rounded-xl cursor-pointer select-none text-left hover:bg-surface-container-high/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container"
            onClick={() => onTabChange('dashboard')}
          >
            <img
              src="/icon-192.png"
              alt="logo"
              className="w-8 h-8 rounded-xl object-contain shadow-sm flex-shrink-0"
            />
            <div className="flex flex-col leading-tight whitespace-nowrap">
              <span className="font-bold text-sm text-on-surface tracking-tight">
                Personal OS
              </span>
              <span className="text-[11px] text-on-surface-variant font-medium">
                chemicv11
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <div className="mt-7 flex flex-col gap-1">
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
                        active={isActive}
                        className={`w-[18px] h-[18px] transition-colors ${
                          isActive ? 'text-on-surface' : 'text-on-surface-variant'
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
                <div className="w-7 h-7 rounded-full bg-inverse-surface text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
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
