'use client';

import React, { useState, useMemo } from 'react';
import { CareerPipeline, CareerStage } from '@/types/database';
import { useCareerStore } from '@/stores/useCareerStore';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { useSyncStore } from '@/lib/supabase-sync';
import { CareerCard } from './CareerCard';
import { CategoryFilter } from './CategoryFilter';
import { CareerModal } from './CareerModal';
import { CareerFollowUpModal } from './CareerFollowUpModal';
import {
  Briefcase,
  Flag,
  Wallet,
  Plus,
  TrendingUp,
  Download,
  SlidersHorizontal,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

export function CareerKanban() {
  const { items, filter, setFilter, addItem, updateItem, deleteItem, moveStage } =
    useCareerStore();
  const wallets = useFinanceStore((state) => state.wallets);
  const isPrivacyMode = useFinanceStore((state) => state.isPrivacyMode);
  const togglePrivacyMode = useFinanceStore((state) => state.togglePrivacyMode);
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CareerPipeline | null>(null);
  const [followUpItem, setFollowUpItem] = useState<CareerPipeline | null>(null);
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [targetStage, setTargetStage] = useState<CareerStage>('applied');
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<CareerStage | null>(null);

  // Filtered items based on active category filter
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [items, filter]);

  // Counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: items.length,
      internship: items.filter((i) => i.category === 'internship').length,
      job: items.filter((i) => i.category === 'job').length,
    };
  }, [items]);

  // Metrics
  const activeCount = items.filter(
    (i) => i.stage !== 'rejected' && i.stage !== 'offer'
  ).length;

  const urgentFollowUpCount = items.filter((i) => {
    if (!i.next_follow_up_date) return false;
    const diff =
      (new Date(i.next_follow_up_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24);
    return diff <= 2;
  }).length;

  // Column definitions with stage dot colors
  const columns: { stage: CareerStage; label: string; dotColor: string }[] = [
    { stage: 'wishlist', label: 'Wishlist', dotColor: 'bg-zinc-400' },
    { stage: 'applied', label: 'Applied', dotColor: 'bg-purple-500' },
    { stage: 'assessment', label: 'Assessment', dotColor: 'bg-primary-container' },
    { stage: 'interview', label: 'Interview', dotColor: 'bg-violet-400' },
    { stage: 'offer', label: 'Offer', dotColor: 'bg-emerald-500' },
    { stage: 'rejected', label: 'Rejected', dotColor: 'bg-rose-400' },
  ];

  const handleOpenAdd = (stage: CareerStage = 'applied') => {
    setEditingItem(null);
    setTargetStage(stage);
    setIsModalOpen(true);
  };

  const handleEdit = (item: CareerPipeline) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<CareerPipeline, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
      setEditingItem(null);
    } else {
      addItem({ ...data, stage: targetStage });
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `career-pipeline-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const showEmailTemplate = () => {
    const sample = `Hi [Recruiter Name],\n\nI hope you are doing well.\n\nI am writing to follow up on my application for the [Role Name] position submitted on [Date]. I remain very interested in the role and would welcome the chance to discuss how I can contribute to your team.\n\nThank you,\nFerrel`;
    navigator.clipboard.writeText(sample);
    setTemplateNotice('Follow-up email template copied to clipboard!');
    setTimeout(() => setTemplateNotice(null), 3500);
  };

  return (
    <section className="relative w-full space-y-6">
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-12 right-12 w-96 h-96 bg-primary-container/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-48 left-10 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header & Interactive Filter Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-on-surface-variant text-[11px] font-semibold tracking-wider uppercase">
              <span className="inline-flex w-2 h-2 rounded-full bg-primary-container animate-pulse" />
              <span>Personal OS • Career &amp; Internship</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
              Career &amp; Internship Pipeline
            </h1>
            <p className="text-xs text-on-surface-variant">
              Track job applications, recruitment stages, CV versions, and follow-up schedules.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleExportJSON}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container-lowest text-on-surface border border-outline/30 shadow-sm hover:bg-surface-container-high transition text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5 text-on-surface-variant" />
              <span>Export Data</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenAdd('applied')}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-inverse-surface text-white hover:bg-black shadow-sm transition text-xs font-semibold hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Record Application</span>
            </button>
          </div>
        </div>

        {/* Segment Tabs Row & Sync Info */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <CategoryFilter
            activeFilter={filter}
            counts={counts}
            onFilterChange={setFilter}
          />

          <div className="hidden lg:flex items-center gap-2 bg-surface-container-lowest px-4 py-1.5 rounded-full border border-outline/30 shadow-sm text-xs text-on-surface-variant">
            <RefreshCw className="w-3.5 h-3.5 text-primary-container" />
            <span>Last synced: {lastSyncedAt ? `Today, ${lastSyncedAt} WIB` : 'Connecting...'}</span>
          </div>
        </div>
      </div>

      {/* Bento Top Metric Row (3 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Card 1: Lamaran Aktif */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_4px_20px_rgba(24,24,27,0.02)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Application Status
              </span>
              <span className="text-base font-bold text-on-surface">Active Applications</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface leading-none font-sans">
              {activeCount}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
              <TrendingUp className="w-3.5 h-3.5 text-primary-container" />
              Active in pipeline
            </span>
          </div>
        </div>

        {/* Card 2: Daily Focus */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_4px_20px_rgba(24,24,27,0.02)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Action Required
              </span>
              <span className="text-base font-bold text-on-surface">Daily Focus</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
              <Flag className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface leading-none font-sans">
              {urgentFollowUpCount} Priorities
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[11px] font-semibold">
              Follow up now
            </span>
          </div>
        </div>

        {/* Card 3: Saldo Dompet (Cross-linked to Keuangan) */}
        <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-outline/30 shadow-[0_4px_20px_rgba(24,24,27,0.02)] flex flex-col justify-between hover:shadow-md transition sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Cash Sync
              </span>
              <span className="text-base font-bold text-on-surface">Wallet Balance</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-2 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-bold text-on-surface leading-none font-sans">
                {isPrivacyMode ? 'Rp •••••••' : `Rp ${totalBalance.toLocaleString('id-ID')}`}
              </span>
              <button
                type="button"
                onClick={togglePrivacyMode}
                className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                title={isPrivacyMode ? 'Reveal balance' : 'Hide balance'}
              >
                {isPrivacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-[11px] font-semibold">
              Live Synced
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid (Horizontal Scrollable on Small Screens) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start snap-x">
        {columns.map((col) => {
          const colItems = filteredItems.filter((i) => i.stage === col.stage);
          const isTargeted = dragOverStage === col.stage;

          return (
            <div
              key={col.stage}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dragOverStage !== col.stage) {
                  setDragOverStage(col.stage);
                }
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOverStage(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage(null);
                const itemId = e.dataTransfer.getData('text/plain');
                if (itemId) {
                  moveStage(itemId, col.stage);
                }
              }}
              className={`flex-shrink-0 w-72 sm:w-80 max-w-[85vw] flex flex-col gap-3 p-3.5 rounded-2xl border min-h-[500px] snap-start transition-all ${
                isTargeted
                  ? 'bg-primary-fixed/30 border-primary-container ring-2 ring-primary-container/20'
                  : 'bg-surface-container-low/70 border-outline/20'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pt-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-surface-container-high text-on-surface-variant flex items-center justify-center text-[11px] font-bold">
                    {colItems.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenAdd(col.stage)}
                  className="w-7 h-7 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
                  title={`Add to ${col.label}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Column Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {colItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-container-lowest/60 border border-dashed border-outline/30 text-center gap-2 my-auto">
                    <span className="text-xs font-semibold text-on-surface">
                      No applications in {col.label}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Add a new application or target company to this stage.
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(col.stage)}
                      className="mt-1 px-3 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold transition"
                    >
                      + Add Application
                    </button>
                  </div>
                ) : (
                  colItems.map((item) => (
                    <CareerCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onMoveStage={moveStage}
                      onDelete={deleteItem}
                      onOpenFollowUp={(it) => {
                        setFollowUpItem(it);
                        setIsFollowUpOpen(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bento Insight Bar */}
      <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline/30 shadow-[0_4px_24px_rgba(24,24,27,0.02)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary-container flex-shrink-0">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-sm font-bold text-on-surface">
              Career Pipeline Pro-Tip
            </span>
            <p className="text-xs text-on-surface-variant">
              Always align CV keywords with the ATS job description before submitting, and send a polite follow-up after 5-7 business days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={showEmailTemplate}
            className="px-4 py-2 rounded-full bg-surface-container-high hover:bg-surface-dim text-on-surface text-xs font-semibold transition"
          >
            Copy Follow-up Email Template
          </button>
        </div>
      </div>

      {/* Toast Notice for template copy */}
      {templateNotice && (
        <div className="fixed bottom-6 right-6 z-50 bg-inverse-surface text-white text-xs px-4 py-2.5 rounded-full shadow-lg border border-outline/30 animate-in fade-in">
          {templateNotice}
        </div>
      )}

      {/* Add / Edit Stepper Modal */}
      <CareerModal
        isOpen={isModalOpen}
        initialData={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />

      {/* 1-Click Career Follow-Up Generator Modal */}
      <CareerFollowUpModal
        item={followUpItem}
        isOpen={isFollowUpOpen}
        onClose={() => {
          setIsFollowUpOpen(false);
          setFollowUpItem(null);
        }}
        onShowNotice={(msg) => setTemplateNotice(msg)}
      />
    </section>
  );
}
