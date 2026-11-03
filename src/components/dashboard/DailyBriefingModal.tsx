'use client';

import React from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDevStore } from '@/stores/useDevStore';
import { Sun, CheckCircle2, Video, Calendar, ArrowRight, X } from 'lucide-react';

interface DailyBriefingModalProps {
  isOpen: boolean;
  rolledOverCount: number;
  onDismiss: () => void;
  onNavigate: (tab: string) => void;
}

export function DailyBriefingModal({
  isOpen,
  rolledOverCount,
  onDismiss,
  onNavigate,
}: DailyBriefingModalProps) {
  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useDevStore((state) => state.projects);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const interviewItems = careerItems.filter((i) => i.stage === 'interview');
  const activeFocusTasks = tasks.filter((t) => t.is_daily_focus && t.status !== 'done');
  const activePorts = projects.map((p) => `:${p.default_port}`).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline/30 shadow-2xl max-w-lg w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                Selamat Pagi, Ferrel
              </h3>
              <p className="text-xs text-on-surface-variant font-medium">
                {todayStr} • Cockpit Briefing
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rollover Notification Banner */}
        {rolledOverCount > 0 && (
          <div className="p-3 rounded-2xl bg-primary-fixed/40 border border-primary-container/20 flex items-center gap-2.5 text-xs text-on-surface">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse flex-shrink-0" />
            <p>
              <strong>{rolledOverCount} tugas P1</strong> dari hari sebelumnya otomatis di-rollover ke <em>Daily Focus</em> hari ini.
            </p>
          </div>
        )}

        {/* 3 Bento Briefing Blocks */}
        <div className="space-y-2.5">
          {/* Block 1: Daily Focus Tasks */}
          <div
            onClick={() => {
              onNavigate('tasks');
              onDismiss();
            }}
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-on-surface block">
                  {activeFocusTasks.length} Prioritas Fokus Hari Ini
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {activeFocusTasks.length > 0 ? activeFocusTasks[0].title : 'Belum ada target tugas'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Block 2: Interviews / Career Radar */}
          <div
            onClick={() => {
              onNavigate('career');
              onDismiss();
            }}
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-on-surface block">
                  {interviewItems.length} Agenda Interview
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {interviewItems.length > 0
                    ? `${interviewItems[0].entity_name} • ${interviewItems[0].role_or_program}`
                    : 'Tidak ada interview terjadwal'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </div>

          {/* Block 3: Dev Sockets */}
          <div
            onClick={() => {
              onNavigate('dev');
              onDismiss();
            }}
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-xs text-on-surface block">
                  Local Dev Workspace
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Ports: {activePorts || ':3000'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-md transition active:scale-95"
          >
            Mulai Deep Work Hari Ini
          </button>
        </div>

      </div>
    </div>
  );
}
