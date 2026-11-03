'use client';

import React, { useState, useMemo } from 'react';
import { CareerPipeline, CareerStage } from '@/types/database';
import { useCareerStore } from '@/stores/useCareerStore';
import { CareerCard } from './CareerCard';
import { CategoryFilter } from './CategoryFilter';
import { CareerModal } from './CareerModal';
import { Plus } from 'lucide-react';

export function CareerKanban() {
  const { items, filter, setFilter, addItem, updateItem, deleteItem, moveStage } =
    useCareerStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CareerPipeline | null>(null);

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

  // Column definitions
  const columns: { stage: CareerStage; label: string; count: number }[] = [
    {
      stage: 'wishlist',
      label: 'Wishlist',
      count: filteredItems.filter((i) => i.stage === 'wishlist').length,
    },
    {
      stage: 'applied',
      label: 'Applied',
      count: filteredItems.filter((i) => i.stage === 'applied').length,
    },
    {
      stage: 'assessment',
      label: 'Assessment',
      count: filteredItems.filter((i) => i.stage === 'assessment').length,
    },
    {
      stage: 'interview',
      label: 'Interview',
      count: filteredItems.filter((i) => i.stage === 'interview').length,
    },
    {
      stage: 'offer',
      label: 'Offer',
      count: filteredItems.filter((i) => i.stage === 'offer').length,
    },
    {
      stage: 'rejected',
      label: 'Rejected',
      count: filteredItems.filter((i) => i.stage === 'rejected').length,
    },
  ];

  const handleEdit = (item: CareerPipeline) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = (data: Omit<CareerPipeline, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingItem) {
      updateItem(editingItem.id, data);
      setEditingItem(null);
    } else {
      addItem(data);
    }
  };

  return (
    <section className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
            Pelacak Lamaran Kerja & Magang
          </h2>
          <p className="text-xs text-appleText-secondary mt-0.5">
            Pantau progress lamaran, versi CV yang dikirim, dan jadwal follow-up.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black transition shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Lamaran</span>
          </button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="border-b border-appleBorder pb-1">
        <CategoryFilter
          activeFilter={filter}
          counts={counts}
          onFilterChange={setFilter}
        />
      </div>

      {/* Kanban Board Container (Smooth horizontal scroll) */}
      <div className="flex gap-4 overflow-x-auto pb-6 pt-1 items-start snap-x">
        {columns.map((col) => {
          const colItems = filteredItems.filter((i) => i.stage === col.stage);

          return (
            <div
              key={col.stage}
              className="flex-shrink-0 w-80 max-w-[85vw] space-y-3 snap-start"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-1 pb-1 border-b border-appleBorder/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-appleText-primary uppercase tracking-wider font-mono">
                    {col.label}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-appleText-muted bg-zinc-200/60 px-1.5 py-0.2 rounded-md">
                    {col.count}
                  </span>
                </div>
              </div>

              {/* Column Cards */}
              <div className="space-y-3 min-h-[150px]">
                {colItems.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-appleBorder/80 text-center text-xs text-appleText-muted">
                    Belum ada lamaran
                  </div>
                ) : (
                  colItems.map((item) => (
                    <CareerCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onMoveStage={moveStage}
                      onDelete={deleteItem}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <CareerModal
        isOpen={isModalOpen}
        initialData={editingItem}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSave}
      />
    </section>
  );
}

