'use client';

import React, { useMemo } from 'react';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDevStore } from '@/stores/useDevStore';

interface MorningBriefingCardProps {
  onNavigate?: (tab: string) => void;
  onOpenQuickCapture?: () => void;
  onOpenCommand?: () => void;
}

export function MorningBriefingCard({
  onNavigate,
  onOpenQuickCapture,
  onOpenCommand,
}: MorningBriefingCardProps) {
  const careerItems = useCareerStore((state) => state.items);
  const tasks = useTaskStore((state) => state.tasks);
  const projects = useDevStore((state) => state.projects);

  // Time & Greeting
  const now = new Date();
  const hour = now.getHours();

  let greetingText = 'Selamat Pagi';
  if (hour >= 11 && hour < 15) {
    greetingText = 'Selamat Siang';
  } else if (hour >= 15 && hour < 18) {
    greetingText = 'Selamat Sore';
  } else if (hour >= 18 || hour < 4) {
    greetingText = 'Selamat Malam';
  }

  const dateFormatted = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => t.status !== 'done').length;
  }, [tasks]);

  const activeInterviewsCount = useMemo(() => {
    return careerItems.filter((i) => i.stage === 'interview').length;
  }, [careerItems]);

  const runningServersCount = useMemo(() => {
    return projects.filter((p) => p.serverState === 'running').length;
  }, [projects]);

  // Contextual Daily Summary
  const summaryHighlight = useMemo(() => {
    const parts: string[] = [];
    if (activeInterviewsCount > 0) {
      parts.push(`${activeInterviewsCount} interview`);
    }
    if (pendingTasksCount > 0) {
      parts.push(`${pendingTasksCount} task aktif`);
    } else {
      parts.push('inbox tugas rapi');
    }
    if (runningServersCount > 0) {
      parts.push(`${runningServersCount} server running`);
    }
    return parts.join(' • ');
  }, [activeInterviewsCount, pendingTasksCount, runningServersCount]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 pb-1">
      <div>
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mb-1">
          <span>Personal OS</span>
          <span>•</span>
          <span className="text-primary-container">Cockpit Overview</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
          {greetingText}, <span className="text-primary-container">Ferrel</span>
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant font-medium mt-1">
          {dateFormatted} • <span className="text-on-surface font-semibold">{summaryHighlight}</span>
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline/30 text-[11px] font-mono text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WIB (UTC+7)</span>
        </span>
      </div>
    </div>
  );
}
