import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: 'note' | 'snippet' | 'prompt' | 'bookmark';
  tags: string[];
  is_pinned: boolean;
  updated_at: string;
}

export interface ContentIdea {
  id: string;
  title: string;
  platform: string;
  status: 'idea' | 'scripting' | 'filming' | 'editing' | 'posted';
  hook_text: string | null;
  script_body: string | null;
  created_at: string;
}

interface NotesState {
  notes: NoteItem[];
  contentIdeas: ContentIdea[];
  addNote: (note: Omit<NoteItem, 'id' | 'updated_at'>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  addContentIdea: (idea: Omit<ContentIdea, 'id' | 'created_at'>) => void;
  updateContentStatus: (id: string, status: ContentIdea['status']) => void;
}

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Prompt Persiapan Interview Technical',
    content: 'Anda adalah Staff Engineer. Uji saya dengan 3 pertanyaan arsitektur microservices vs modular monolith.',
    type: 'prompt',
    tags: ['ai', 'interview'],
    is_pinned: true,
    updated_at: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Supabase Realtime Channel Helper',
    content: 'const channel = supabase.channel("daemon:control").on("broadcast", { event: "run" }, callback).subscribe();',
    type: 'snippet',
    tags: ['supabase', 'code'],
    is_pinned: false,
    updated_at: new Date().toISOString(),
  },
];

const INITIAL_CONTENT: ContentIdea[] = [
  {
    id: 'content-1',
    title: 'Cara Bikin Personal OS untuk Tracking Karir & Server',
    platform: 'TikTok/Reels',
    status: 'scripting',
    hook_text: 'Jangan buka 5 aplikasi berbeda cuma buat cek server lokal dan lamaran magang!',
    script_body: 'Pernah ga ngerasa repot harus buka VS Code cuma buat nyalain npm run dev? Di video ini gw tunjukin command center...',
    created_at: new Date().toISOString(),
  },
];

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: INITIAL_NOTES,
      contentIdeas: INITIAL_CONTENT,
      addNote: (note) =>
        set((state) => ({
          notes: [
            {
              ...note,
              id: `note-${Date.now()}`,
              updated_at: new Date().toISOString(),
            },
            ...state.notes,
          ],
        })),
      deleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      togglePinNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, is_pinned: !n.is_pinned } : n
          ),
        })),
      addContentIdea: (idea) =>
        set((state) => ({
          contentIdeas: [
            {
              ...idea,
              id: `content-${Date.now()}`,
              created_at: new Date().toISOString(),
            },
            ...state.contentIdeas,
          ],
        })),
      updateContentStatus: (id, status) =>
        set((state) => ({
          contentIdeas: state.contentIdeas.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        })),
    }),
    {
      name: 'chemicvll-notes-storage',
    }
  )
);

