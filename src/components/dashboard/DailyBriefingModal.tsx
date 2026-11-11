'use client';

import React, { useEffect } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDevStore } from '@/stores/useDevStore';
import { CheckCircle2, Video, Calendar, ArrowRight, X } from 'lucide-react';
import { BriefingMark } from '@/components/icons/ChemicIcons';

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

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const interviewItems = careerItems.filter((i) => i.stage === 'interview');
  const activeFocusTasks = tasks.filter((t) => t.is_daily_focus && t.status !== 'done');
  const activePorts = projects.map((p) => `:${p.default_port}`).join(', ');

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline/30 shadow-2xl max-w-lg w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline/20">
          <div className="flex items-center gap-2.5">
            <BriefingMark className="w-6 h-6 text-on-surface shrink-0" />
            <div>
              <h3 className="font-bold text-base text-on-surface">
                Good Morning, Ferrel
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
              <strong>{rolledOverCount} priority tasks</strong> from yesterday were automatically rolled over into today&apos;s <em>Daily Focus</em>.
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
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-xs text-on-surface block truncate">
                  {activeFocusTasks.length} Daily Focus Priorities
                </span>
                <span className="text-[11px] text-on-surface-variant truncate block">
                  {activeFocusTasks.length > 0 ? activeFocusTasks[0].title : 'No target tasks yet'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform shrink-0" />
          </div>

          {/* Block 2: Interviews / Career Radar */}
          <div
            onClick={() => {
              onNavigate('career');
              onDismiss();
            }}
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center shrink-0">
                <Video className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-xs text-on-surface block truncate">
                  {interviewItems.length} Scheduled Interviews
                </span>
                <span className="text-[11px] text-on-surface-variant truncate block">
                  {interviewItems.length > 0
                    ? `${interviewItems[0].entity_name} • ${interviewItems[0].role_or_program}`
                    : 'No interviews scheduled'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform shrink-0" />
          </div>

          {/* Block 3: Dev Sockets */}
          <div
            onClick={() => {
              onNavigate('dev');
              onDismiss();
            }}
            className="p-3.5 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer flex items-center justify-between gap-3 group"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-xs text-on-surface block truncate">
                  Local Dev Workspace
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono truncate block">
                  Ports: {activePorts || ':3000'}
                </span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-on-surface-variant group-hover:translate-x-1 transition-transform shrink-0" />
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2.5 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-md transition active:scale-95"
          >
            Start Deep Work Session
          </button>
        </div>

      </div>
    </div>
  );
}
