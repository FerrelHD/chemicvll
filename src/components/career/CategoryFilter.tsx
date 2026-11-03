'use client';

import React from 'react';

interface CategoryFilterProps {
  activeFilter: 'all' | 'internship' | 'job';
  counts: { all: number; internship: number; job: number };
  onFilterChange: (filter: 'all' | 'internship' | 'job') => void;
}

export function CategoryFilter({ activeFilter, counts, onFilterChange }: CategoryFilterProps) {
  const filters: { id: 'all' | 'internship' | 'job'; label: string; count: number }[] = [
    { id: 'all', label: 'Semua', count: counts.all },
    { id: 'internship', label: 'Magang', count: counts.internship },
    { id: 'job', label: 'Full-time', count: counts.job },
  ];

  return (
    <div className="flex items-center gap-5 text-xs">
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`pb-1 transition-all ${
              isActive
                ? 'font-bold text-appleText-primary border-b-2 border-zinc-900'
                : 'text-appleText-muted hover:text-appleText-primary font-normal'
            }`}
          >
            {f.label}{' '}
            <span className="font-mono text-[11px] text-appleText-muted">
              ({f.count})
            </span>
          </button>
        );
      })}
    </div>
  );
}

