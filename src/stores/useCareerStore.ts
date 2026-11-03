import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CareerPipeline, CareerStage } from '@/types/database';

interface CareerState {
  items: CareerPipeline[];
  filter: 'all' | 'internship' | 'job';
  setFilter: (filter: 'all' | 'internship' | 'job') => void;
  addItem: (item: Omit<CareerPipeline, 'id' | 'created_at' | 'updated_at'>) => void;
  updateItem: (id: string, updates: Partial<CareerPipeline>) => void;
  deleteItem: (id: string) => void;
  moveStage: (id: string, stage: CareerStage) => void;
}

// Clean slate ready for Ferrel's actual career applications
const INITIAL_ITEMS: CareerPipeline[] = [];

export const useCareerStore = create<CareerState>()(
  persist(
    (set) => ({
      items: INITIAL_ITEMS,
      filter: 'all',
      setFilter: (filter) => set({ filter }),
      addItem: (newItem) =>
        set((state) => ({
          items: [
            {
              ...newItem,
              id: `career-${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...state.items,
          ],
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item
          ),
        })),
      deleteItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      moveStage: (id, stage) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, stage, updated_at: new Date().toISOString() } : item
          ),
        })),
    }),
    {
      name: 'chemicvll-career-storage',
    }
  )
);

