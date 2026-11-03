'use client';

import React from 'react';

interface CategoryFilterProps {
  activeFilter: 'all' | 'internship' | 'job';
  counts: { all: number; internship: number; job: number };
  onFilterChange: (filter: 'all' | 'internship' | 'job') => void;
}

export function CategoryFilter({ activeFilter, counts, onFilterChange }: CategoryFilterProps) {
  const filters: { id: 'all' | 'internship' | 'job'; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'internship', label: 'Internship', count: counts.internship },
    { id: 'job', label: 'Full-time', count: counts.job },
  ];

  return (
    <div className="inline-flex items-center p-1 bg-surface-container-high rounded-full shadow-inner">
      {filters.map((f) => {
        const isActive = activeFilter === f.id;
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onFilterChange(f.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {f.label} ({f.count})
          </button>
        );
      })}
    </div>
  );
}
