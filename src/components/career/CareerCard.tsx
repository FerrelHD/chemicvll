'use client';

import React, { useState } from 'react';
import { CareerPipeline, CareerStage } from '@/types/database';
import { getDaysElapsed, getFollowUpStatus } from '@/lib/career-utils';
import { getRadarStatus, generateFollowUpDraft } from '@/lib/career-radar';
import {
  Building2,
  FileText,
  Globe,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronDown,
  Send,
  Check,
} from 'lucide-react';

interface CareerCardProps {
  item: CareerPipeline;
  onEdit: (item: CareerPipeline) => void;
  onMoveStage: (id: string, stage: CareerStage) => void;
  onDelete: (id: string) => void;
}

export function CareerCard({ item, onEdit, onMoveStage, onDelete }: CareerCardProps) {
  const [draftCopied, setDraftCopied] = useState(false);
  const daysElapsed = getDaysElapsed(item.applied_date);
  const followUp = getFollowUpStatus(item.next_follow_up_date);
  const radar = getRadarStatus(item);

  const handleCopyDraft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const draft = generateFollowUpDraft(item, 'email');
    navigator.clipboard.writeText(draft);
    setDraftCopied(true);
    setTimeout(() => setDraftCopied(false), 2000);
  };

  const stageOptions: { value: CareerStage; label: string }[] = [
    { value: 'wishlist', label: 'Wishlist' },
    { value: 'applied', label: 'Applied' },
    { value: 'assessment', label: 'Assessment' },
    { value: 'interview', label: 'Interview' },
    { value: 'offer', label: 'Offer' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const isInternship = item.category === 'internship';

  return (
    <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-[0_3px_12px_rgba(24,24,27,0.03)] border border-outline/30 flex flex-col gap-3 group hover:shadow-md transition-all">
      {/* Category Tag & Platform Source */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
            isInternship
              ? 'bg-tertiary-fixed text-on-tertiary-fixed'
              : 'bg-primary-container text-white'
          }`}
        >
          {isInternship ? 'Magang' : item.category === 'job' ? 'Full-Time' : item.category}
        </span>

        {item.platform_source && (
          <span className="text-xs text-on-surface-variant flex items-center gap-1 font-medium">
            <Globe className="w-3 h-3 text-on-surface-variant" />
            <span>via {item.platform_source}</span>
          </span>
        )}
      </div>

      {/* Role Title & Organization Location */}
      <div className="flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-bold text-sm md:text-base text-on-surface leading-tight">
            {item.role_or_program}
          </h4>
          {item.portal_url && (
            <a
              href={item.portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-on-surface-variant hover:text-primary-container p-0.5 transition"
              title="Buka Link Lowongan"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-on-surface-variant text-xs mt-1">
          <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-on-surface-variant" />
          <span className="truncate">
            {item.entity_name}
            {item.location && ` • ${item.location}`}
            {item.work_type && ` (${item.work_type})`}
          </span>
        </div>
      </div>

      {/* Metadata Pill Table */}
      <div className="bg-surface-container-low p-2.5 rounded-xl flex flex-col gap-1.5 text-xs">
        {item.applied_date && (
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Applied:</span>
            <span className="text-on-surface font-medium">
              {new Date(item.applied_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              {daysElapsed && (
                <span className="text-on-surface-variant text-[11px] font-normal">
                  ({daysElapsed})
                </span>
              )}
            </span>
          </div>
        )}

        {item.resume_version && (
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>CV:</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface font-mono text-[11px] border border-outline/30 font-medium truncate max-w-[170px]">
              <FileText className="w-3 h-3 text-primary-container flex-shrink-0" />
              <span className="truncate">{item.resume_version}</span>
            </span>
          </div>
        )}

        {item.stipend_or_salary && (
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Gaji/Uang Saku:</span>
            <span className="text-on-surface font-medium truncate max-w-[170px]">
              {item.stipend_or_salary}
            </span>
          </div>
        )}

        {item.deadline && (
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Deadline:</span>
            <span className="text-on-surface font-medium">
              {new Date(item.deadline).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Automated Radar Urgency Banner */}
      {radar.isUrgent && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-primary-fixed/40 border border-primary-container/30 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-primary-container text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
            <span>{radar.label}</span>
          </div>
          <button
            type="button"
            onClick={handleCopyDraft}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-inverse-surface text-white text-[11px] font-semibold hover:bg-black transition active:scale-95 shadow-sm"
          >
            {draftCopied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Disalin!</span>
              </>
            ) : (
              <>
                <Send className="w-3 h-3" />
                <span>Salin Draf</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Urgent Follow-up Alert Pill */}
      {followUp && !radar.isUrgent && (
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${
            followUp.isDue
              ? 'bg-primary-fixed text-on-primary-fixed-variant'
              : 'bg-surface-container-high text-on-surface'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              followUp.isDue
                ? 'bg-primary-container animate-pulse'
                : 'bg-primary'
            }`}
          />
          <span>{followUp.label}</span>
        </div>
      )}

      {/* Action Footer: Stage Select & Edit/Delete Controls */}
      <div className="flex items-center justify-between pt-1 border-t border-outline/20 mt-0.5">
        <div className="relative">
          <select
            value={item.stage}
            onChange={(e) => onMoveStage(item.id, e.target.value as CareerStage)}
            className="appearance-none bg-surface-container-high hover:bg-surface-dim text-xs font-semibold text-on-surface px-3 py-1 pr-6 rounded-full cursor-pointer transition-colors outline-none border border-outline/30"
          >
            {stageOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Move: {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-on-surface-variant absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="w-7 h-7 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
            title="Edit Lamaran"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Hapus lamaran ${item.role_or_program} di ${item.entity_name}?`)) {
                onDelete(item.id);
              }
            }}
            className="w-7 h-7 rounded-full hover:bg-red-50 hover:text-error flex items-center justify-center text-on-surface-variant transition-colors"
            title="Hapus Lamaran"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
