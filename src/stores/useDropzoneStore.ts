import { create } from 'zustand';
import { DropzoneItem } from '@/types/database';
import { purgeExpiredDropzoneItems } from '@/lib/dropzone-purger';

interface DropzoneState {
  items: DropzoneItem[];
  addItem: (content: string, type?: 'text' | 'link' | 'code') => void;
  deleteItem: (id: string) => void;
  togglePin: (id: string) => void;
  purgeExpired: () => number;
}

// Clean slate ready for Ferrel's actual clipboard & file dropzone items
const INITIAL_DROPZONE_ITEMS: DropzoneItem[] = [];

export const useDropzoneStore = create<DropzoneState>((set) => ({
  items: INITIAL_DROPZONE_ITEMS,
  addItem: (content, explicitType) => {
    let type: 'text' | 'link' | 'code' = explicitType || 'text';
    if (!explicitType) {
      if (/^https?:\/\//i.test(content.trim())) {
        type = 'link';
      } else if (content.includes('{') || content.includes('const ') || content.includes('function ') || content.includes('\n')) {
        type = 'code';
      }
    }

    const newItem: DropzoneItem = {
      id: `drop-${Date.now()}`,
      content: content.trim(),
      type,
      device_source: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
      is_pinned: false,
      created_at: new Date().toISOString(),
    };

    set((state) => ({ items: [newItem, ...state.items] }));
  },
  deleteItem: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
  togglePin: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, is_pinned: !item.is_pinned } : item
      ),
    })),
  purgeExpired: () => {
    const { retainedItems, purgedCount } = purgeExpiredDropzoneItems(
      useDropzoneStore.getState().items
    );
    if (purgedCount > 0) {
      set({ items: retainedItems });
    }
    return purgedCount;
  },
}));

