'use client';

import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CareerKanban } from '@/components/career/CareerKanban';
import { useCareerStore } from '@/stores/useCareerStore';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('career');
  const items = useCareerStore((state) => state.items);

  // Quick summary stats
  const totalActive = items.filter((i) => i.stage !== 'rejected' && i.stage !== 'offer').length;
  const inAssessmentOrInterview = items.filter(
    (i) => i.stage === 'assessment' || i.stage === 'interview'
  ).length;
  const offersCount = items.filter((i) => i.stage === 'offer').length;

  return (
    <div className="min-h-screen bg-canvas flex flex-col pb-20 md:pb-8">
      {/* Apple Clean Topbar */}
      <Header />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-7">
        
        {/* Quick KPI Strip (Flat, Clean Apple Typography) */}
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple">
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Lamaran Aktif
            </span>
            <span className="text-xl font-bold text-appleText-primary mt-1 block">
              {totalActive}
            </span>
          </div>

          <div className="bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple">
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Dalam Proses (Tes / Interview)
            </span>
            <span className="text-xl font-bold text-amber-700 mt-1 block">
              {inAssessmentOrInterview}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-card p-3.5 rounded-lg border border-appleBorder shadow-apple">
            <span className="text-[11px] font-mono text-appleText-muted uppercase tracking-wider block">
              Offer Diterima
            </span>
            <span className="text-xl font-bold text-emerald-700 mt-1 block">
              {offersCount}
            </span>
          </div>
        </section>

        {/* Primary View: Career & Internship Kanban */}
        {activeTab === 'career' ? (
          <CareerKanban />
        ) : (
          <div className="bg-card rounded-lg border border-appleBorder p-8 text-center text-xs text-appleText-secondary">
            <p className="font-semibold text-appleText-primary text-sm mb-1">
              Modul {activeTab.toUpperCase()}
            </p>
            <p>Akan aktif pada fase pengembangan berikutnya sesuai roadmap PRD.</p>
          </div>
        )}
      </main>

      {/* Mobile Navigation for PWA */}
      <MobileNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
