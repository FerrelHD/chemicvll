'use client';

import React from 'react';
import { CareerPipeline, CareerStage } from '@/types/database';
import { getDaysElapsed, getFollowUpStatus } from '@/lib/career-utils';
import { ExternalLink, MoreHorizontal } from 'lucide-react';

interface CareerCardProps {
  item: CareerPipeline;
  onEdit: (item: CareerPipeline) => void;
  onMoveStage: (id: string, stage: CareerStage) => void;
  onDelete: (id: string) => void;
}

export function CareerCard({ item, onEdit, onMoveStage, onDelete }: CareerCardProps) {
  const daysElapsed = getDaysElapsed(item.applied_date);
  const followUp = getFollowUpStatus(item.next_follow_up_date);

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
    <div className="bg-card rounded-lg border border-appleBorder p-4 shadow-apple hover:shadow-appleHover transition-all space-y-3">
      {/* Category & Source Header (Pure Typography, No Capsule/Pill Box) */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`font-bold text-xs uppercase tracking-wider ${
            isInternship ? 'text-[#0066CC]' : 'text-[#5856D6]'
          }`}
        >
          {item.category === 'internship'
            ? 'Magang'
            : item.category === 'job'
            ? 'Full-time'
            : item.category}
        </span>
        {item.platform_source && (
          <span className="text-appleText-muted font-mono text-[11px]">
            via {item.platform_source}
          </span>
        )}
      </div>

      {/* Title & Organization */}
      <div>
        <h4 className="text-sm font-semibold text-appleText-primary leading-snug">
          {item.role_or_program}
        </h4>
        <p className="text-xs text-appleText-secondary mt-0.5">
          {item.entity_name}
          {item.location && ` • ${item.location}`}
          {item.work_type && ` (${item.work_type})`}
        </p>
      </div>

      {/* Clean Metadata Rows (Flat, No Nested Inner Boxes) */}
      <div className="pt-2 border-t border-zinc-100 space-y-1 text-xs">
        {item.applied_date && (
          <div className="flex items-center justify-between">
            <span className="text-appleText-muted">Applied:</span>
            <span className="font-medium text-appleText-primary">
              {new Date(item.applied_date).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              {daysElapsed && (
                <span className="text-appleText-muted font-normal text-[11px]">
                  ({daysElapsed})
                </span>
              )}
            </span>
          </div>
        )}

        {item.resume_version && (
          <div className="flex items-center justify-between">
            <span className="text-appleText-muted">CV:</span>
            <span className="font-mono text-[11px] text-appleText-primary truncate max-w-[170px]">
              {item.resume_version}
            </span>
          </div>
        )}

        {item.stipend_or_salary && (
          <div className="flex items-center justify-between">
            <span className="text-appleText-muted">Gaji/Uang Saku:</span>
            <span className="text-appleText-primary text-[11px] font-medium">
              {item.stipend_or_salary}
            </span>
          </div>
        )}

        {item.deadline && (
          <div className="flex items-center justify-between">
            <span className="text-appleText-muted">Deadline:</span>
            <span className="text-appleText-primary text-[11px]">
              {new Date(item.deadline).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>
        )}
      </div>

      {/* Follow-up Alert (Pure Bold Typography, No Box) */}
      {followUp && (
        <div className="pt-1.5 border-t border-zinc-100 flex items-center justify-between text-xs">
          <span
            className={`font-semibold text-xs flex items-center gap-1.5 ${
              followUp.isDue ? 'text-amber-700' : 'text-appleText-muted font-normal'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                followUp.isDue ? 'bg-amber-600 animate-pulse' : 'bg-zinc-400'
              }`}
            ></span>
            {followUp.label}
          </span>
        </div>
      )}

      {/* Card Actions & Stage Mover */}
      <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
        <select
          value={item.stage}
          onChange={(e) => onMoveStage(item.id, e.target.value as CareerStage)}
          className="bg-transparent text-[11px] text-appleText-secondary hover:text-appleText-primary cursor-pointer border-none outline-none font-medium"
        >
          {stageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Move: {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          {item.portal_url && (
            <a
              href={item.portal_url}
              target="_blank"
              rel="noreferrer"
              className="text-appleText-muted hover:text-[#0066CC] transition"
              title="Buka Portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="text-appleText-secondary hover:text-appleText-primary font-medium text-[11px]"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="text-red-500/80 hover:text-red-600 text-[11px]"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

