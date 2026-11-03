import { create } from 'zustand';
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

// Initial realistic seed items for immediate use
const INITIAL_ITEMS: CareerPipeline[] = [
  {
    id: 'tokopedia-intern',
    entity_name: 'Tokopedia',
    role_or_program: 'Software Engineer Intern',
    category: 'internship',
    stage: 'applied',
    applied_date: '2026-10-24T00:00:00Z',
    deadline: '2026-11-15T00:00:00Z',
    platform_source: 'LinkedIn',
    work_type: 'hybrid',
    location: 'Jakarta',
    resume_version: 'CV-SE-v2.pdf',
    stipend_or_salary: 'Rp 4.500.000 / bln',
    contact_person: 'Sarah (Talent Acquisition)',
    next_follow_up_date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    portal_url: 'https://www.tokopedia.com/careers',
    notes: 'Submitted via company portal after LinkedIn referral.',
  },
  {
    id: 'traveloka-intern',
    entity_name: 'Traveloka',
    role_or_program: 'Frontend Engineering Intern',
    category: 'internship',
    stage: 'applied',
    applied_date: '2026-10-28T00:00:00Z',
    deadline: null,
    platform_source: 'Glints',
    work_type: 'remote',
    location: 'Remote Indonesia',
    resume_version: 'CV-React-Frontend.pdf',
    stipend_or_salary: null,
    contact_person: null,
    next_follow_up_date: null,
    portal_url: 'https://careers.traveloka.com',
    notes: 'React & Next.js focus. Waiting for HR screening.',
  },
  {
    id: 'fintech-fulltime',
    entity_name: 'Fintech Asia',
    role_or_program: 'Junior Backend Developer',
    category: 'job',
    stage: 'assessment',
    applied_date: '2026-10-15T00:00:00Z',
    deadline: '2026-11-05T23:59:00Z',
    platform_source: 'Website',
    work_type: 'onsite',
    location: 'Jakarta Selatan',
    resume_version: 'CV-Backend-Go.pdf',
    stipend_or_salary: 'Rp 8.000.000 - Rp 10.000.000',
    contact_person: 'hr@fintechasia.co',
    next_follow_up_date: '2026-11-05',
    portal_url: 'https://hackerrank.com/test-link',
    notes: 'HackerRank test (90 minutes) needs to be completed before Thursday.',
  },
  {
    id: 'govtech-intern',
    entity_name: 'GovTech Edu',
    role_or_program: 'Fullstack Web Intern',
    category: 'internship',
    stage: 'interview',
    applied_date: '2026-10-10T00:00:00Z',
    deadline: null,
    platform_source: 'Referral',
    work_type: 'remote',
    location: 'Remote',
    resume_version: 'CV-Fullstack-v3.pdf',
    stipend_or_salary: 'Rp 5.000.000 / bln',
    contact_person: 'Mas Budi (Tech Lead)',
    next_follow_up_date: '2026-11-06',
    portal_url: 'https://meet.google.com/abc-defg-hij',
    notes: 'User interview scheduled for Friday at 14:00 WIB.',
  },
];

export const useCareerStore = create<CareerState>((set) => ({
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
}));

