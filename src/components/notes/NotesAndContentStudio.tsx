'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNotesStore, NoteItem, ContentIdea } from '@/stores/useNotesStore';
import { LedgerNoteMark } from '@/components/icons/ChemicIcons';
import { MarkdownRenderer, stripMarkdown } from './MarkdownRenderer';
import {
  BookOpen,
  Video,
  Pin,
  Plus,
  Trash2,
  Code,
  MessageSquare,
  Bookmark,
  Copy,
  Check,
  ChevronDown,
  X,
  Maximize2,
  Minimize2,
  Calendar,
  Tag,
  Sparkles,
  Bold,
  Italic,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Edit3,
} from 'lucide-react';

type NoteDraft = Omit<NoteItem, 'id' | 'updated_at'>;
type ContentDraft = Omit<ContentIdea, 'id' | 'created_at'>;

const EMPTY_NOTE_DRAFT: NoteDraft = {
  title: '',
  content: '',
  type: 'note',
  tags: [],
  is_pinned: false,
};

const EMPTY_CONTENT_DRAFT: ContentDraft = {
  title: '',
  hook_text: null,
  script_body: null,
  platform: 'TikTok/Reels',
  status: 'idea',
};

const FORMAT_ACTIONS = [
  { icon: Bold, prefix: '**', suffix: '**', placeholder: 'teks tebal', title: 'Bold (**teks**)', showForContent: true },
  { icon: Italic, prefix: '*', suffix: '*', placeholder: 'teks miring', title: 'Italic (*teks*)', showForContent: true },
  { icon: Heading1, prefix: '\n# ', suffix: '', placeholder: 'Judul Bab', title: 'Heading 1 (# Judul)', showForContent: false },
  { icon: Heading2, prefix: '\n## ', suffix: '', placeholder: 'Sub Judul', title: 'Heading 2 (## Sub Judul)', showForContent: false },
  { icon: ListOrdered, prefix: '\n1. ', suffix: '', placeholder: 'Langkah pertama', title: 'Daftar Nomor (1. Langkah)', showForContent: true },
  { icon: List, prefix: '\n- ', suffix: '', placeholder: 'Poin item', title: 'Daftar Poin (- Poin)', showForContent: true },
  { icon: CheckSquare, prefix: '\n- [ ] ', suffix: '', placeholder: 'Tugas baru', title: 'Checklist (- [ ] Tugas)', showForContent: true },
  { icon: Quote, prefix: '\n> ', suffix: '', placeholder: 'Kutipan / Catatan', title: 'Kutipan (> Catatan)', showForContent: true },
  { icon: Code, prefix: '`', suffix: '`', placeholder: 'kode', title: 'Inline Code (`kode`)', showForContent: false },
  { icon: Minus, prefix: '\n---\n', suffix: '', placeholder: '', title: 'Garis Pemisah (---)', showForContent: true },
] as const;

function toggleCheckboxLine(markdown: string, lineIndex: number, newChecked: boolean): string {
  const lines = markdown.split('\n');
  if (lineIndex < 0 || lineIndex >= lines.length) return markdown;
  const line = lines[lineIndex];
  lines[lineIndex] = newChecked
    ? line.replace(/^([-*]\s+\[)[ ](\])/, '$1x$2')
    : line.replace(/^([-*]\s+\[)[xX](\])/, '$1 $2');
  return lines.join('\n');
}

function shouldEnterEditFromReadClick(target: EventTarget | null): boolean {
  if (typeof window !== 'undefined' && window.getSelection()?.toString()) return false;
  if (target instanceof HTMLElement && target.closest('button, a, pre, code, input, textarea, select')) {
    return false;
  }
  return true;
}

interface MarkdownFormatBarProps {
  includeExtended: boolean;
  wordCount: number;
  onFormat: (prefix: string, suffix: string, placeholder: string) => void;
}

function MarkdownFormatBar({ includeExtended, wordCount, onFormat }: MarkdownFormatBarProps) {
  const actions = includeExtended ? FORMAT_ACTIONS : FORMAT_ACTIONS.filter((a) => a.showForContent);
  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-surface-container-low rounded-2xl border border-outline/25">
      <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.title}
              type="button"
              onClick={() => onFormat(action.prefix, action.suffix, action.placeholder)}
              className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition shrink-0"
              title={action.title}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
      <span className="text-[11px] text-on-surface-variant/70 px-2 shrink-0 hidden sm:inline">
        {wordCount} kata • ⌘/Ctrl+Enter selesai
      </span>
    </div>
  );
}

interface DocumentModalShellProps {
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onClose: () => void;
  leftControls: React.ReactNode;
  rightControls: React.ReactNode;
  children: React.ReactNode;
}

function DocumentModalShell({
  isMaximized,
  onToggleMaximize,
  onClose,
  leftControls,
  rightControls,
  children,
}: DocumentModalShellProps) {
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl border border-outline/30 shadow-2xl w-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0 transition-all ${
          isMaximized ? 'max-w-[98vw] h-[96dvh]' : 'max-w-4xl h-[94dvh] sm:h-[88dvh]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto sm:hidden mt-2.5 mb-1 shrink-0" />

        {/* Clean Top Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-outline/20 shrink-0 bg-surface-container-low/40">
          <div className="flex items-center gap-2 flex-wrap min-w-0">{leftControls}</div>
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
            {rightControls}
            <div className="w-px h-4 bg-outline/20 mx-0.5 hidden sm:block" />
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition hidden sm:inline-flex"
              title={isMaximized ? 'Perkecil tampilan' : 'Perbesar layar penuh'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Single-Column Editorial Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-12 py-4 sm:py-6">
          <div className="max-w-3xl mx-auto w-full flex flex-col min-h-full space-y-5">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function NotesAndContentStudio() {
  const {
    notes,
    contentIdeas,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    addContentIdea,
    updateContentStatus,
    updateContentIdea,
    deleteContentIdea,
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<'notes' | 'content'>('notes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Active Note / Draft modal state
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<NoteDraft | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Active Content / Draft modal state
  const [viewingContentId, setViewingContentId] = useState<string | null>(null);
  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);

  const [isMaximized, setIsMaximized] = useState(false);

  const noteTitleRef = useRef<HTMLInputElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentTitleRef = useRef<HTMLInputElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const savedNote = notes.find((n) => n.id === viewingNoteId) || null;
  const activeNote: (NoteDraft & { id?: string; updated_at?: string }) | null = savedNote || noteDraft;

  const savedContent = contentIdeas.find((c) => c.id === viewingContentId) || null;
  const activeContent: (ContentDraft & { id?: string; created_at?: string }) | null =
    savedContent || contentDraft;

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeNoteModal = () => {
    setViewingNoteId(null);
    setNoteDraft(null);
    setIsEditingNote(false);
    setNewTagInput('');
  };

  const closeContentModal = () => {
    setViewingContentId(null);
    setContentDraft(null);
    setIsEditingContent(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (activeNote) {
        if (isEditingNote && savedNote) {
          setIsEditingNote(false);
        } else {
          closeNoteModal();
        }
      } else if (activeContent) {
        if (isEditingContent && savedContent) {
          setIsEditingContent(false);
        } else {
          closeContentModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeNote, activeContent, isEditingNote, isEditingContent, savedNote, savedContent]);

  useEffect(() => {
    document.body.style.overflow = activeNote || activeContent ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeNote, activeContent]);

  const handleOpenNewNote = () => {
    setViewingNoteId(null);
    setNoteDraft({ ...EMPTY_NOTE_DRAFT });
    setIsEditingNote(true);
    setTimeout(() => noteTitleRef.current?.focus(), 30);
  };

  const handleOpenExistingNote = (id: string) => {
    setNoteDraft(null);
    setViewingNoteId(id);
    setIsEditingNote(false);
  };

  const handleOpenNewContent = () => {
    setViewingContentId(null);
    setContentDraft({ ...EMPTY_CONTENT_DRAFT });
    setIsEditingContent(true);
    setTimeout(() => contentTitleRef.current?.focus(), 30);
  };

  const handleOpenExistingContent = (id: string) => {
    setContentDraft(null);
    setViewingContentId(id);
    setIsEditingContent(false);
  };

  const commitOrUpdateNote = (updates: Partial<NoteDraft>) => {
    if (savedNote) {
      updateNote(savedNote.id, updates);
      return;
    }
    const nextDraft = { ...(noteDraft || EMPTY_NOTE_DRAFT), ...updates };
    const hasMeaningfulContent =
      nextDraft.title.trim().length > 0 ||
      nextDraft.content.trim().length > 0 ||
      nextDraft.tags.length > 0;
    if (hasMeaningfulContent) {
      const createdId = addNote(nextDraft);
      setViewingNoteId(createdId);
      setNoteDraft(null);
    } else {
      setNoteDraft(nextDraft);
    }
  };

  const commitOrUpdateContent = (updates: Partial<ContentDraft>) => {
    if (savedContent) {
      updateContentIdea(savedContent.id, updates);
      return;
    }
    const nextDraft = { ...(contentDraft || EMPTY_CONTENT_DRAFT), ...updates };
    const hasMeaningfulContent =
      nextDraft.title.trim().length > 0 ||
      (nextDraft.hook_text || '').trim().length > 0 ||
      (nextDraft.script_body || '').trim().length > 0;
    if (hasMeaningfulContent) {
      const createdId = addContentIdea(nextDraft);
      setViewingContentId(createdId);
      setContentDraft(null);
    } else {
      setContentDraft(nextDraft);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInsertFormat = (
    target: 'note' | 'content',
    prefix: string,
    suffix: string,
    defaultPlaceholder: string
  ) => {
    const textarea = target === 'note' ? noteTextareaRef.current : contentTextareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const contentToInsert = selectedText || defaultPlaceholder;
    const newText = text.substring(0, start) + prefix + contentToInsert + suffix + text.substring(end);

    if (target === 'note') {
      commitOrUpdateNote({ content: newText });
    } else {
      commitOrUpdateContent({ script_body: newText });
    }

    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      textarea.setSelectionRange(newStart, newStart + contentToInsert.length);
    }, 15);
  };

  const enterNoteEditMode = () => {
    setIsEditingNote(true);
    setTimeout(() => noteTextareaRef.current?.focus(), 20);
  };

  const enterContentEditMode = () => {
    setIsEditingContent(true);
    setTimeout(() => contentTextareaRef.current?.focus(), 20);
  };

  const sortedNotes = [...notes].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <section className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-outline/20">
        <div className="flex items-center gap-3">
          <LedgerNoteMark active className="w-6 h-6 text-on-surface shrink-0" />
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface">
              Second Brain &amp; Content Studio
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Catatan teknis, prompt AI, snippet, dan naskah konten dalam satu ruang yang rapi.
            </p>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-2xl border border-outline/30 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'notes'
                  ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Code className="w-3.5 h-3.5 shrink-0" />
              <span>Notes ({notes.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'content'
                  ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Video className="w-3.5 h-3.5 shrink-0" />
              <span>Content ({contentIdeas.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={activeTab === 'notes' ? handleOpenNewNote : handleOpenNewContent}
            className="w-full sm:w-auto min-h-[40px] flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white font-semibold shadow-sm text-xs active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{activeTab === 'notes' ? 'Catatan Baru' : 'Ide Konten'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: NOTES & SNIPPETS */}
      {activeTab === 'notes' ? (
        sortedNotes.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl border border-dashed border-outline/40 p-10 text-center space-y-3">
            <p className="text-sm font-semibold text-on-surface">Belum ada catatan tersimpan</p>
            <p className="text-xs text-on-surface-variant">
              Mulai tulis catatan, code snippet, atau prompt AI pertamamu.
            </p>
            <button
              type="button"
              onClick={handleOpenNewNote}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-white text-xs font-semibold shadow-sm hover:opacity-90 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Catatan Baru</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => handleOpenExistingNote(n.id)}
                className={`min-w-0 cursor-pointer group bg-surface-container-lowest p-4 rounded-3xl border shadow-bento space-y-3 transition-all hover:shadow-bentoHover hover:border-primary-container/50 hover:-translate-y-0.5 ${
                  n.is_pinned ? 'border-primary-container/40 ring-1 ring-primary-container/20' : 'border-outline/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    {n.type === 'snippet' && <Code className="w-3.5 h-3.5 text-purple-600" />}
                    {n.type === 'prompt' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    {n.type === 'bookmark' && <Bookmark className="w-3.5 h-3.5 text-blue-600" />}
                    {n.type === 'note' && <BookOpen className="w-3.5 h-3.5 text-amber-600" />}
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                      {n.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(n.id, n.content);
                      }}
                      className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary-container transition-colors"
                      title="Salin isi"
                    >
                      {copiedId === n.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePinNote(n.id);
                      }}
                      className={`p-1.5 rounded-full hover:bg-surface-container transition-colors ${
                        n.is_pinned ? 'text-primary-container bg-primary-fixed/40' : 'text-on-surface-variant'
                      }`}
                      title={n.is_pinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(n.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors"
                      title="Hapus note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary-container transition-colors line-clamp-2">
                  {n.title || 'Catatan Tanpa Judul'}
                </h4>

                <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-2xl max-h-32 overflow-hidden border border-outline/20 leading-relaxed relative font-sans">
                  <p className="line-clamp-4 whitespace-pre-wrap break-words">
                    {stripMarkdown(n.content) || '(Belum ada isi catatan)'}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none" />
                </div>

                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {n.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      ) : /* VIEW 2: CONTENT STUDIO */
      contentIdeas.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl border border-dashed border-outline/40 p-10 text-center space-y-3">
          <p className="text-sm font-semibold text-on-surface">Belum ada ide konten</p>
          <p className="text-xs text-on-surface-variant">
            Catat hook pembuka, outline, dan script video atau artikelmu di sini.
          </p>
          <button
            type="button"
            onClick={handleOpenNewContent}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-container text-white text-xs font-semibold shadow-sm hover:opacity-90 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buat Ide Konten</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {contentIdeas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => handleOpenExistingContent(idea.id)}
              className="min-w-0 cursor-pointer group bg-surface-container-lowest p-4 rounded-3xl border border-outline/30 shadow-bento space-y-3 flex flex-col justify-between transition-all hover:shadow-bentoHover hover:border-primary-container/50 hover:-translate-y-0.5"
            >
              <div className="space-y-2.5 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs pb-2 border-b border-outline/10">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                    {idea.platform}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <select
                        value={idea.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateContentStatus(idea.id, e.target.value as ContentIdea['status'])}
                        className="appearance-none font-mono text-[11px] bg-surface-container-high hover:bg-surface-dim px-2.5 py-1 pr-6 rounded-xl border border-outline/30 text-on-surface cursor-pointer font-semibold outline-none transition-colors"
                      >
                        <option value="idea">💡 Idea</option>
                        <option value="scripting">📝 Scripting</option>
                        <option value="filming">🎬 Filming</option>
                        <option value="editing">✂️ Editing</option>
                        <option value="posted">✅ Posted</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContentIdea(idea.id);
                      }}
                      className="p-1.5 rounded-full text-on-surface-variant hover:text-error transition"
                      title="Hapus ide"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary-container transition-colors line-clamp-2">
                  {idea.title || 'Ide Tanpa Judul'}
                </h4>

                {idea.hook_text && (
                  <div className="text-xs p-2.5 rounded-2xl bg-primary-fixed/30 border border-primary-container/20 text-on-surface font-medium line-clamp-2">
                    <span className="font-bold text-primary-container">Hook:</span> &ldquo;{idea.hook_text}&rdquo;
                  </div>
                )}

                {idea.script_body && (
                  <p className="text-xs text-on-surface-variant line-clamp-3 leading-relaxed bg-surface-container-low p-3 rounded-2xl border border-outline/20 font-sans">
                    {stripMarkdown(idea.script_body)}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-outline/10 flex items-center justify-between text-[11px] text-on-surface-variant">
                <span>{new Date(idea.created_at).toLocaleDateString('id-ID')}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(
                      idea.id,
                      `${idea.title}\n\nHook: ${idea.hook_text || '-'}\n\n${idea.script_body || ''}`
                    );
                  }}
                  className="hover:text-primary-container flex items-center gap-1 font-semibold"
                >
                  {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === idea.id ? 'Tersalin' : 'Salin Script'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SINGLE-COLUMN READ-FIRST MODAL FOR NOTES */}
      {activeNote &&
        mounted && (
          <DocumentModalShell
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized((prev) => !prev)}
            onClose={closeNoteModal}
            leftControls={
              <>
                <div className="relative">
                  <select
                    value={activeNote.type}
                    onChange={(e) => commitOrUpdateNote({ type: e.target.value as NoteItem['type'] })}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="note">📝 Catatan</option>
                    <option value="snippet">💻 Snippet</option>
                    <option value="prompt">🤖 AI Prompt</option>
                    <option value="bookmark">🔖 Bookmark</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high/60">
                  {savedNote ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <span>Draft baru</span>
                  )}
                </span>
              </>
            }
            rightControls={
              <>
                <button
                  type="button"
                  onClick={() => (isEditingNote ? setIsEditingNote(false) : enterNoteEditMode())}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isEditingNote
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  {isEditingNote ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(savedNote?.id || 'draft-note', activeNote.content)}
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold transition flex items-center gap-1"
                  title="Salin isi catatan"
                >
                  {copiedId === (savedNote?.id || 'draft-note') ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {savedNote && (
                  <>
                    <button
                      type="button"
                      onClick={() => togglePinNote(savedNote.id)}
                      className={`p-2 rounded-xl transition ${
                        savedNote.is_pinned
                          ? 'bg-primary-fixed/60 text-primary-container'
                          : 'hover:bg-surface-container-high text-on-surface-variant'
                      }`}
                      title={savedNote.is_pinned ? 'Unpin' : 'Pin ke atas'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteNote(savedNote.id);
                        closeNoteModal();
                      }}
                      className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-on-surface-variant hover:text-error transition"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </>
            }
          >
            {/* Title */}
            <input
              ref={noteTitleRef}
              type="text"
              value={activeNote.title}
              onChange={(e) => commitOrUpdateNote({ title: e.target.value })}
              placeholder="Judul catatan..."
              className="w-full text-xl sm:text-3xl font-bold tracking-tight text-on-surface bg-transparent focus:outline-none placeholder:text-outline-variant/60"
            />

            {/* Compact Metadata Line (Date + Tags) */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-on-surface-variant pb-3 border-b border-outline/15">
              {activeNote.updated_at && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-primary-container" />
                  <span>
                    {new Date(activeNote.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                <Tag className="w-3.5 h-3.5 text-primary-container shrink-0" />
                {activeNote.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-[11px] font-medium text-on-surface"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() =>
                        commitOrUpdateNote({ tags: activeNote.tags.filter((t) => t !== tag) })
                      }
                      className="text-on-surface-variant hover:text-error"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  placeholder="+ tag"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = newTagInput.trim().replace(/^#/, '').toLowerCase();
                      if (val && !activeNote.tags.includes(val)) {
                        commitOrUpdateNote({ tags: [...activeNote.tags, val] });
                      }
                      setNewTagInput('');
                    }
                  }}
                  className="px-1.5 py-0.5 text-base sm:text-[11px] bg-transparent border-b border-transparent focus:border-primary-container outline-none placeholder:text-on-surface-variant/40 w-28"
                />
              </div>
            </div>

            {/* Single-Column Body: Edit vs Read */}
            {isEditingNote ? (
              <div className="flex flex-col flex-1 space-y-3">
                <MarkdownFormatBar
                  includeExtended
                  wordCount={activeNote.content.split(/\s+/).filter(Boolean).length}
                  onFormat={(prefix, suffix, placeholder) =>
                    handleInsertFormat('note', prefix, suffix, placeholder)
                  }
                />
                <textarea
                  ref={noteTextareaRef}
                  value={activeNote.content}
                  onChange={(e) => commitOrUpdateNote({ content: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      setIsEditingNote(false);
                    }
                  }}
                  placeholder="Mulai tulis catatan... (Mendukung markdown: # Heading, **bold**, - [ ] checklist, ```code```)"
                  className="w-full flex-1 min-h-[340px] py-2 font-sans text-base sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
              </div>
            ) : (
              <div
                onClick={(e) => {
                  if (shouldEnterEditFromReadClick(e.target)) {
                    enterNoteEditMode();
                  }
                }}
                className="flex-1 min-h-[320px] cursor-text rounded-2xl transition-colors"
                title="Klik untuk mengedit catatan"
              >
                {activeNote.content.trim() ? (
                  <MarkdownRenderer
                    content={activeNote.content}
                    onToggleCheckbox={(lineIndex, newChecked) =>
                      commitOrUpdateNote({
                        content: toggleCheckboxLine(activeNote.content, lineIndex, newChecked),
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant/50 italic py-4">
                    Klik di sini untuk mulai menulis catatan...
                  </p>
                )}
              </div>
            )}
          </DocumentModalShell>
        )}

      {/* SINGLE-COLUMN READ-FIRST MODAL FOR CONTENT STUDIO */}
      {activeContent &&
        mounted && (
          <DocumentModalShell
            isMaximized={isMaximized}
            onToggleMaximize={() => setIsMaximized((prev) => !prev)}
            onClose={closeContentModal}
            leftControls={
              <>
                <div className="relative">
                  <select
                    value={activeContent.platform}
                    onChange={(e) => commitOrUpdateContent({ platform: e.target.value })}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="TikTok/Reels">TikTok / Reels</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Blog">Blog / Medium</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                <div className="relative">
                  <select
                    value={activeContent.status}
                    onChange={(e) =>
                      commitOrUpdateContent({ status: e.target.value as ContentIdea['status'] })
                    }
                    className="appearance-none font-mono px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="scripting">📝 Scripting</option>
                    <option value="filming">🎬 Filming</option>
                    <option value="editing">✂️ Editing</option>
                    <option value="posted">✅ Posted</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high/60">
                  {savedContent ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
                      <span>Tersimpan</span>
                    </>
                  ) : (
                    <span>Draft baru</span>
                  )}
                </span>
              </>
            }
            rightControls={
              <>
                <button
                  type="button"
                  onClick={() => (isEditingContent ? setIsEditingContent(false) : enterContentEditMode())}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isEditingContent
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'bg-surface-container-high text-on-surface hover:bg-surface-dim'
                  }`}
                >
                  {isEditingContent ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesai</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      savedContent?.id || 'draft-content',
                      `${activeContent.title}\n\nHook: ${activeContent.hook_text || '-'}\n\n${
                        activeContent.script_body || ''
                      }`
                    )
                  }
                  className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-semibold transition flex items-center gap-1"
                  title="Salin script & hook"
                >
                  {copiedId === (savedContent?.id || 'draft-content') ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                {savedContent && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteContentIdea(savedContent.id);
                      closeContentModal();
                    }}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-on-surface-variant hover:text-error transition"
                    title="Hapus Ide Konten"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            }
          >
            {/* Title */}
            <input
              ref={contentTitleRef}
              type="text"
              value={activeContent.title}
              onChange={(e) => commitOrUpdateContent({ title: e.target.value })}
              placeholder="Judul topik video / konten..."
              className="w-full text-xl sm:text-3xl font-bold tracking-tight text-on-surface bg-transparent focus:outline-none placeholder:text-outline-variant/60"
            />

            {/* Compact Metadata */}
            {activeContent.created_at && (
              <div className="flex items-center gap-3 text-xs text-on-surface-variant pb-3 border-b border-outline/15">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary-container" />
                  <span>
                    {new Date(activeContent.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <span>•</span>
                <span>{activeContent.platform}</span>
              </div>
            )}

            {/* Hook Section */}
            <div className="p-4 rounded-2xl bg-primary-fixed/25 border border-primary-container/25 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary-container uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Hook Pembuka</span>
              </div>
              {isEditingContent ? (
                <textarea
                  rows={2}
                  value={activeContent.hook_text || ''}
                  onChange={(e) => commitOrUpdateContent({ hook_text: e.target.value })}
                  placeholder="Kalimat pembuka 3 detik pertama..."
                  className="w-full bg-transparent text-base sm:text-sm text-on-surface font-medium focus:outline-none resize-none placeholder:text-on-surface-variant/40 leading-relaxed"
                />
              ) : (
                <p
                  onClick={enterContentEditMode}
                  className="text-sm text-on-surface font-medium leading-relaxed cursor-text"
                >
                  {activeContent.hook_text?.trim() ? (
                    activeContent.hook_text
                  ) : (
                    <span className="italic text-on-surface-variant/50 font-normal">
                      Klik untuk tambah hook pembuka...
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Single-Column Script Body: Edit vs Read */}
            {isEditingContent ? (
              <div className="flex flex-col flex-1 space-y-3">
                <MarkdownFormatBar
                  includeExtended={false}
                  wordCount={(activeContent.script_body || '').split(/\s+/).filter(Boolean).length}
                  onFormat={(prefix, suffix, placeholder) =>
                    handleInsertFormat('content', prefix, suffix, placeholder)
                  }
                />
                <textarea
                  ref={contentTextareaRef}
                  value={activeContent.script_body || ''}
                  onChange={(e) => commitOrUpdateContent({ script_body: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      setIsEditingContent(false);
                    }
                  }}
                  placeholder="Tulis outline atau naskah lengkap di sini..."
                  className="w-full flex-1 min-h-[280px] py-2 font-sans text-base sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none placeholder:text-on-surface-variant/40"
                />
              </div>
            ) : (
              <div
                onClick={(e) => {
                  if (shouldEnterEditFromReadClick(e.target)) {
                    enterContentEditMode();
                  }
                }}
                className="flex-1 min-h-[260px] cursor-text rounded-2xl transition-colors"
                title="Klik untuk mengedit script"
              >
                {activeContent.script_body?.trim() ? (
                  <MarkdownRenderer
                    content={activeContent.script_body}
                    onToggleCheckbox={(lineIndex, newChecked) =>
                      commitOrUpdateContent({
                        script_body: toggleCheckboxLine(
                          activeContent.script_body || '',
                          lineIndex,
                          newChecked
                        ),
                      })
                    }
                  />
                ) : (
                  <p className="text-sm text-on-surface-variant/50 italic py-4">
                    Klik di sini untuk mulai menulis outline atau script...
                  </p>
                )}
              </div>
            )}
          </DocumentModalShell>
        )}
    </section>
  );
}
