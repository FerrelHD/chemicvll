'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useCareerStore } from '@/stores/useCareerStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useDevStore } from '@/stores/useDevStore';
import { BriefingMark } from '@/components/icons/ChemicIcons';

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
    <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-1 pb-1">
      <div>
        <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider mb-1">
          <BriefingMark className="w-4 h-4 text-on-surface shrink-0" />
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

      {/* 3D Breakout Engine Core Orb (Apple/Linear Bento style) */}
      <div className="absolute right-1 top-0 sm:top-auto sm:right-36 lg:right-44 sm:-bottom-7 z-20 pointer-events-none select-none">
        <motion.div
          animate={{ y: [-3, 3, -3], rotate: [0, 2, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="w-14 h-14 sm:w-20 sm:h-20 lg:w-24 lg:h-24 drop-shadow-[0_12px_24px_rgba(255,107,0,0.22)]"
        >
          <img
            src="/assets/3d/engine-core.webp"
            alt="Personal OS Engine Core"
            className="w-full h-full object-contain"
            loading="eager"
          />
        </motion.div>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container border border-outline/30 text-[11px] font-semibold tabular-nums text-on-surface-variant">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>WIB (UTC+7)</span>
        </span>
      </div>
    </div>
  );
}
