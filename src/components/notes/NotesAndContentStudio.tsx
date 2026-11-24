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
  Columns,
  Calendar,
  Tag,
  FileText,
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
  Eye,
  Edit3,
} from 'lucide-react';

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

  // Quick Note creation form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteItem['type']>('note');

  // Quick Content idea creation form state
  const [contentTitle, setContentTitle] = useState('');
  const [contentHook, setContentHook] = useState('');
  const [contentScript, setContentScript] = useState('');
  const [contentPlatform, setContentPlatform] = useState('TikTok/Reels');

  // Notion-style Modal Window states
  const [mounted, setMounted] = useState(false);
  const [viewingNoteId, setViewingNoteId] = useState<string | null>(null);
  const [viewingContentId, setViewingContentId] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Mode states for Markdown editing vs rich preview
  const [noteViewMode, setNoteViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [contentViewMode, setContentViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isNoteMaximized, setIsNoteMaximized] = useState(false);
  const [isContentMaximized, setIsContentMaximized] = useState(false);

  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const viewingNote = notes.find((n) => n.id === viewingNoteId) || null;
  const viewingContent = contentIdeas.find((c) => c.id === viewingContentId) || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut listener: ESC to close any open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingNoteId(null);
        setViewingContentId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Lock body scroll when a modal window is open
  useEffect(() => {
    if (viewingNoteId || viewingContentId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingNoteId, viewingContentId]);

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    addNote({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      type: noteType,
      tags: [],
      is_pinned: false,
    });
    setNoteTitle('');
    setNoteContent('');
  };

  const handleCreateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTitle.trim()) return;
    addContentIdea({
      title: contentTitle.trim(),
      hook_text: contentHook.trim() || null,
      script_body: contentScript.trim() || null,
      platform: contentPlatform,
      status: 'idea',
    });
    setContentTitle('');
    setContentHook('');
    setContentScript('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to insert markdown formatting at cursor / selection
  const handleInsertFormat = (
    target: 'note' | 'content',
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = ''
  ) => {
    const textarea = target === 'note' ? noteTextareaRef.current : contentTextareaRef.current;
    if (!textarea) return;

    // Switch to edit mode if currently previewing
    if (target === 'note' && noteViewMode === 'preview') {
      setNoteViewMode('edit');
    } else if (target === 'content' && contentViewMode === 'preview') {
      setContentViewMode('edit');
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    const selectedText = text.substring(start, end);
    const contentToInsert = selectedText || defaultPlaceholder;
    const newText = text.substring(0, start) + prefix + contentToInsert + suffix + text.substring(end);

    if (target === 'note' && viewingNote) {
      updateNote(viewingNote.id, { content: newText });
    } else if (target === 'content' && viewingContent) {
      updateContentIdea(viewingContent.id, { script_body: newText });
    }

    setTimeout(() => {
      textarea.focus();
      const newStart = start + prefix.length;
      const newEnd = newStart + contentToInsert.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 15);
  };

  // Interactive checkbox toggling for Note Markdown Preview
  const handleToggleNoteCheckbox = (lineIndex: number, newChecked: boolean) => {
    if (!viewingNote) return;
    const lines = viewingNote.content.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const updatedLine = newChecked
        ? line.replace(/^([-*]\s+\[)[ ](\])/, '$1x$2')
        : line.replace(/^([-*]\s+\[)[xX](\])/, '$1 $2');
      lines[lineIndex] = updatedLine;
      updateNote(viewingNote.id, { content: lines.join('\n') });
    }
  };

  // Interactive checkbox toggling for Content Studio Markdown Preview
  const handleToggleContentCheckbox = (lineIndex: number, newChecked: boolean) => {
    if (!viewingContent || !viewingContent.script_body) return;
    const lines = viewingContent.script_body.split('\n');
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const line = lines[lineIndex];
      const updatedLine = newChecked
        ? line.replace(/^([-*]\s+\[)[ ](\])/, '$1x$2')
        : line.replace(/^([-*]\s+\[)[xX](\])/, '$1 $2');
      lines[lineIndex] = updatedLine;
      updateContentIdea(viewingContent.id, { script_body: lines.join('\n') });
    }
  };

  // Sort notes: pinned first
  const sortedNotes = [...notes].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <section className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
        <div className="flex items-center gap-3">
          <LedgerNoteMark active className="w-6 h-6 text-on-surface shrink-0" />
          <div>
            <h2 className="text-xl font-bold tracking-tight text-on-surface">
              Second Brain &amp; Content Studio
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Repositori catatan teknis, AI prompts, code snippets, dan pipeline ide konten video dengan rich formatting.
            </p>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-2xl border border-outline/30 w-full sm:w-auto">
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
            <span className="truncate">
              <span className="sm:hidden">Notes ({notes.length})</span>
              <span className="hidden sm:inline">Notes &amp; Snippets ({notes.length})</span>
            </span>
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
            <span className="truncate">
              <span className="sm:hidden">Content ({contentIdeas.length})</span>
              <span className="hidden sm:inline">Content Studio ({contentIdeas.length})</span>
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: NOTES & SNIPPETS */}
      {activeTab === 'notes' ? (
        <div className="space-y-6">
          {/* Add Note Form */}
          <form
            onSubmit={handleCreateNote}
            className="bg-surface-container-lowest p-5 rounded-3xl border border-outline/40 shadow-bento space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline/20">
              <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-primary-container" />
                <span>Tambah Catatan atau Snippet Baru</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Judul catatan / nama snippet..."
                className="sm:col-span-3 px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container font-medium text-xs"
              />
              <div className="relative sm:col-span-1">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as any)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-2xl border border-outline/30 bg-surface-container-low hover:bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary-container font-semibold text-xs cursor-pointer transition-all outline-none"
                >
                  <option value="note">📝 Catatan Umum</option>
                  <option value="snippet">💻 Code Snippet</option>
                  <option value="prompt">🤖 AI Prompt</option>
                  <option value="bookmark">🔖 Bookmark</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <textarea
              rows={3}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Isi catatan, command terminal, list nomor, atau prompt AI (mendukung markdown **bold**, 1. numbering, dll)..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container font-sans text-xs leading-relaxed resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white font-semibold shadow-sm text-xs active:scale-95 transition-all"
              >
                Simpan Catatan
              </button>
            </div>
          </form>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedNotes.map((n) => (
              <div
                key={n.id}
                onClick={() => setViewingNoteId(n.id)}
                className={`cursor-pointer group bg-surface-container-lowest p-4 rounded-3xl border shadow-bento space-y-3 transition-all hover:shadow-bentoHover hover:border-primary-container/50 hover:-translate-y-0.5 ${
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

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingNoteId(n.id);
                      }}
                      className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary-container transition-colors"
                      title="Buka tampilan Notion"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
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
                  {n.title}
                </h4>

                {/* Clean, stripped markdown preview */}
                <div className="text-xs text-on-surface-variant bg-surface-container-low p-3 rounded-2xl max-h-36 overflow-hidden border border-outline/20 leading-relaxed relative font-sans">
                  <p className="line-clamp-4 whitespace-pre-wrap">
                    {stripMarkdown(n.content) || '(Belum ada isi catatan)'}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-container-low to-transparent pointer-events-none" />
                </div>

                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
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
        </div>
      ) : (
        /* VIEW 2: CONTENT STUDIO */
        <div className="space-y-6">
          {/* New Content Idea Form */}
          <form
            onSubmit={handleCreateContent}
            className="bg-surface-container-lowest p-5 rounded-3xl border border-outline/40 shadow-bento space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline/20">
              <span className="font-bold text-sm text-on-surface flex items-center gap-1.5">
                <Video className="w-4 h-4 text-primary-container" />
                <span>Ide Konten Video &amp; Artikel Baru</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="Judul / Topik video (cth. Setup Personal OS di Mac)..."
                className="sm:col-span-2 px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container font-medium text-xs"
              />
              <div className="relative sm:col-span-1">
                <select
                  value={contentPlatform}
                  onChange={(e) => setContentPlatform(e.target.value)}
                  className="w-full appearance-none px-3.5 py-2.5 pr-8 rounded-2xl border border-outline/30 bg-surface-container-low hover:bg-surface-container-lowest text-on-surface focus:outline-none focus:border-primary-container font-semibold text-xs cursor-pointer transition-all outline-none"
                >
                  <option value="TikTok/Reels">TikTok / Instagram Reels</option>
                  <option value="YouTube">YouTube Video</option>
                  <option value="LinkedIn">LinkedIn Post</option>
                  <option value="Blog">Technical Blog / Medium</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <input
              type="text"
              value={contentHook}
              onChange={(e) => setContentHook(e.target.value)}
              placeholder="Hook 3 detik pertama (kalimat pembuka yang memikat audience)..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container text-xs"
            />

            <textarea
              rows={3}
              value={contentScript}
              onChange={(e) => setContentScript(e.target.value)}
              placeholder="Outline script, poin-poin penting, atau draft caption..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container text-xs leading-relaxed resize-none"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white font-semibold shadow-sm text-xs active:scale-95 transition-all"
              >
                Simpan Ide Konten
              </button>
            </div>
          </form>

          {/* Content Ideas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {contentIdeas.map((idea) => (
              <div
                key={idea.id}
                onClick={() => setViewingContentId(idea.id)}
                className="cursor-pointer group bg-surface-container-lowest p-5 rounded-3xl border border-outline/30 shadow-bento space-y-3.5 flex flex-col justify-between transition-all hover:shadow-bentoHover hover:border-primary-container/50 hover:-translate-y-0.5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                      {idea.platform}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <select
                          value={idea.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => updateContentStatus(idea.id, e.target.value as any)}
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
                        className="p-1 rounded-full text-on-surface-variant hover:text-error transition"
                        title="Hapus ide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-on-surface leading-tight group-hover:text-primary-container transition-colors">
                    {idea.title}
                  </h4>

                  {idea.hook_text && (
                    <div className="text-xs p-3 rounded-2xl bg-primary-fixed/30 border border-primary-container/20 text-on-surface font-medium">
                      <span className="font-bold text-primary-container">Hook:</span> &ldquo;{idea.hook_text}&rdquo;
                    </div>
                  )}

                  {idea.script_body && (
                    <p className="text-xs text-on-surface-variant line-clamp-4 leading-relaxed bg-surface-container-low p-3 rounded-2xl border border-outline/20 font-sans">
                      {stripMarkdown(idea.script_body)}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-outline/10 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Dibuat: {new Date(idea.created_at).toLocaleDateString('id-ID')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingContentId(idea.id);
                      }}
                      className="hover:text-primary-container flex items-center gap-1 font-semibold"
                    >
                      <Maximize2 className="w-3 h-3" />
                      <span>Buka</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(idea.id, `${idea.title}\n\nHook: ${idea.hook_text || '-'}\n\n${idea.script_body || ''}`);
                      }}
                      className="hover:text-primary-container flex items-center gap-1 font-semibold"
                    >
                      {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === idea.id ? 'Tersalin' : 'Salin Script'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NOTION-STYLE LARGE MODAL FOR NOTES & SNIPPETS */}
      {viewingNote && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingNoteId(null)}
        >
          <div
            className={`bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl border border-outline/30 shadow-2xl w-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0 transition-all ${
              isNoteMaximized
                ? 'max-w-[98vw] h-[96vh] sm:h-[96vh]'
                : 'max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[94vh] sm:h-[88vh] md:h-[90vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto sm:hidden mt-2.5 mb-1 shrink-0" />

            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-outline/20 shrink-0 bg-surface-container-low/40">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Type Selector Pill */}
                <div className="relative">
                  <select
                    value={viewingNote.type}
                    onChange={(e) => updateNote(viewingNote.id, { type: e.target.value as any })}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="note">📝 Catatan Umum</option>
                    <option value="snippet">💻 Code Snippet</option>
                    <option value="prompt">🤖 AI Prompt</option>
                    <option value="bookmark">🔖 Bookmark</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                {/* Auto-save indicator */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Tersimpan otomatis</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCopy(viewingNote.id, viewingNote.content)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-container-high text-on-surface text-xs font-semibold transition"
                  title="Salin isi catatan"
                >
                  {copiedId === viewingNote.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="hidden sm:inline">Salin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => togglePinNote(viewingNote.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    viewingNote.is_pinned
                      ? 'bg-primary-container text-white shadow-sm'
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                  title={viewingNote.is_pinned ? 'Unpin' : 'Pin ke atas'}
                >
                  <Pin className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{viewingNote.is_pinned ? 'Pinned' : 'Pin'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deleteNote(viewingNote.id);
                    setViewingNoteId(null);
                  }}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-on-surface-variant hover:text-error transition"
                  title="Hapus Catatan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-outline/20 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setIsNoteMaximized(!isNoteMaximized)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition hidden sm:inline-flex"
                  title={isNoteMaximized ? 'Perkecil tampilan' : 'Perbesar layar penuh'}
                >
                  {isNoteMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingNoteId(null)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notion Scrollable Body Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-5 sm:py-6 space-y-4">
              {/* Title Section (Large Notion-Style) */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={viewingNote.title}
                  onChange={(e) => updateNote(viewingNote.id, { title: e.target.value })}
                  placeholder="Judul tanpa nama..."
                  className="w-full text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface bg-transparent focus:outline-none placeholder:text-outline-variant/60"
                />

                {/* Metadata Row (Properties bar ala Notion) */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-on-surface-variant py-2 border-y border-outline/15">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-container" />
                    <span>
                      Diubah: {new Date(viewingNote.updated_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary-container" />
                    <span>
                      {viewingNote.content.split(/\s+/).filter(Boolean).length} kata • {viewingNote.content.length} karakter
                    </span>
                  </div>

                  {/* Tags Section */}
                  <div className="flex items-center gap-1.5 flex-wrap flex-1">
                    <Tag className="w-3.5 h-3.5 text-primary-container shrink-0" />
                    {viewingNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-[11px] font-semibold text-on-surface"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => {
                            const next = viewingNote.tags.filter((t) => t !== tag);
                            updateNote(viewingNote.id, { tags: next });
                          }}
                          className="hover:text-error ml-0.5 text-on-surface-variant hover:text-red-500"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      placeholder="+ Tambah tag (Enter)"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          const val = newTagInput.trim().replace(/^#/, '').toLowerCase();
                          if (val && !viewingNote.tags.includes(val)) {
                            updateNote(viewingNote.id, { tags: [...viewingNote.tags, val] });
                          }
                          setNewTagInput('');
                        }
                      }}
                      className="px-2 py-0.5 text-[11px] bg-transparent border-b border-outline/30 focus:border-primary-container outline-none placeholder:text-on-surface-variant/40 w-32"
                    />
                  </div>
                </div>
              </div>

              {/* QUICK FORMATTING TOOLBAR & VIEW MODE SWITCHER (OPTI 2) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline/25">
                {/* Format buttons bar */}
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '**', '**', 'teks tebal')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition font-bold"
                    title="Bold / Tebal (**teks**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '*', '*', 'teks miring')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition italic"
                    title="Italic / Miring (*teks*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-outline/20 mx-0.5 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n# ', '', 'Judul Bab')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition font-bold"
                    title="Heading 1 (# Judul)"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n## ', '', 'Sub Judul')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition font-bold"
                    title="Heading 2 (## Sub Judul)"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-outline/20 mx-0.5 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n1. ', '', 'Langkah pertama')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Daftar Nomor (1. Langkah)"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n- ', '', 'Poin item')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Daftar Poin (- Poin)"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n- [ ] ', '', 'Tugas baru')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Checklist To-Do (- [ ] Tugas)"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-outline/20 mx-0.5 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n> ', '', 'Kutipan / Catatan penting')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Kutipan / Quote (> Catatan)"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '`', '`', 'kode')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition font-mono text-xs"
                    title="Inline Code (`kode`)"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('note', '\n---\n')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Garis Pemisah (---)"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mode Selector Pill: Tulis (Edit) vs Split View vs Pratinjau (Preview) */}
                <div className="flex items-center gap-1 p-0.5 bg-surface-container-high rounded-xl shrink-0 self-end sm:self-auto border border-outline/20">
                  <button
                    type="button"
                    onClick={() => setNoteViewMode('edit')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      noteViewMode === 'edit'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Hanya Editor Markdown (Layar Penuh)"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Tulis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteViewMode('split')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      noteViewMode === 'split'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Split View (Editor + Pratinjau Rapi)"
                  >
                    <Columns className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteViewMode('preview')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      noteViewMode === 'preview'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Hanya Pratinjau Markdown (Layar Penuh)"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Pratinjau</span>
                  </button>
                </div>
              </div>

              {/* Content Body Area (Split View vs Live Edit vs Rendered Markdown Preview) */}
              <div className="flex flex-col flex-1 min-h-[420px] lg:min-h-[500px]">
                {noteViewMode === 'split' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {/* Left Pane: Markdown Editor */}
                    <div className="flex flex-col rounded-2xl border border-outline/30 bg-surface-container-low/40 overflow-hidden focus-within:border-primary-container/80 transition shadow-inner">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-primary-container" />
                          <span>Editor Markdown</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70">
                          {viewingNote.content.split(/\s+/).filter(Boolean).length} kata • {viewingNote.content.length} karakter
                        </span>
                      </div>
                      <textarea
                        ref={noteTextareaRef}
                        value={viewingNote.content}
                        onChange={(e) => updateNote(viewingNote.id, { content: e.target.value })}
                        placeholder="Mulai ketik catatan di sini... (Gunakan toolbar di atas untuk bold, heading, numbering, checklist)"
                        className="w-full flex-1 p-4 sm:p-5 font-sans text-xs sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none min-h-[260px] md:min-h-[440px] placeholder:text-on-surface-variant/40"
                      />
                    </div>

                    {/* Right Pane: Live Rendered Preview */}
                    <div className="flex flex-col rounded-2xl border border-outline/25 bg-surface-container-low/30 overflow-hidden shadow-xs">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-primary-container" />
                          <span>Pratinjau Live</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Sinkron</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 flex-1 min-h-[260px] md:min-h-[440px] overflow-y-auto">
                        <MarkdownRenderer
                          content={viewingNote.content}
                          onToggleCheckbox={handleToggleNoteCheckbox}
                        />
                      </div>
                    </div>
                  </div>
                ) : noteViewMode === 'preview' ? (
                  <div className="flex flex-col rounded-2xl border border-outline/25 bg-surface-container-low/30 overflow-hidden shadow-xs flex-1">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary-container" />
                        <span>Pratinjau Rapi (Layar Penuh)</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Format Aktif</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 flex-1 min-h-[380px] md:min-h-[480px] overflow-y-auto">
                      <MarkdownRenderer
                        content={viewingNote.content}
                        onToggleCheckbox={handleToggleNoteCheckbox}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col rounded-2xl border border-outline/30 bg-surface-container-low/50 overflow-hidden focus-within:border-primary-container/80 transition shadow-inner flex-1">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-primary-container" />
                        <span>Editor Penuh</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70">
                        {viewingNote.content.split(/\s+/).filter(Boolean).length} kata • {viewingNote.content.length} karakter
                      </span>
                    </div>
                    <textarea
                      ref={noteTextareaRef}
                      value={viewingNote.content}
                      onChange={(e) => updateNote(viewingNote.id, { content: e.target.value })}
                      placeholder="Mulai ketik catatan di sini... (Gunakan toolbar di atas untuk bold, heading, numbering, checklist)"
                      className="w-full flex-1 p-4 sm:p-6 font-sans text-xs sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none min-h-[380px] md:min-h-[480px] placeholder:text-on-surface-variant/40"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* NOTION-STYLE LARGE MODAL FOR CONTENT STUDIO */}
      {viewingContent && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setViewingContentId(null)}
        >
          <div
            className={`bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl border border-outline/30 shadow-2xl w-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-0 transition-all ${
              isContentMaximized
                ? 'max-w-[98vw] h-[96vh] sm:h-[96vh]'
                : 'max-w-4xl lg:max-w-6xl xl:max-w-7xl h-[94vh] sm:h-[88vh] md:h-[90vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drag handle */}
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto sm:hidden mt-2.5 mb-1 shrink-0" />

            {/* Top Toolbar */}
            <div className="flex items-center justify-between px-5 sm:px-8 py-3.5 border-b border-outline/20 shrink-0 bg-surface-container-low/40">
              <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                {/* Platform Selector */}
                <div className="relative">
                  <select
                    value={viewingContent.platform}
                    onChange={(e) => updateContentIdea(viewingContent.id, { platform: e.target.value })}
                    className="appearance-none px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="TikTok/Reels">TikTok / Instagram Reels</option>
                    <option value="YouTube">YouTube Video</option>
                    <option value="LinkedIn">LinkedIn Post</option>
                    <option value="Blog">Technical Blog / Medium</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                {/* Status Selector */}
                <div className="relative">
                  <select
                    value={viewingContent.status}
                    onChange={(e) => updateContentStatus(viewingContent.id, e.target.value as any)}
                    className="appearance-none font-mono text-xs px-3 py-1.5 pr-7 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-dim border border-outline/30 outline-none cursor-pointer transition"
                  >
                    <option value="idea">💡 Idea</option>
                    <option value="scripting">📝 Scripting</option>
                    <option value="filming">🎬 Filming</option>
                    <option value="editing">✂️ Editing</option>
                    <option value="posted">✅ Posted</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
                </div>

                {/* Auto-save indicator */}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>Tersimpan otomatis</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(
                      viewingContent.id,
                      `${viewingContent.title}\n\nHook: ${viewingContent.hook_text || '-'}\n\n${viewingContent.script_body || ''}`
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-container-high text-on-surface text-xs font-semibold transition"
                  title="Salin script & hook"
                >
                  {copiedId === viewingContent.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                      <span className="hidden sm:inline">Salin Script</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    deleteContentIdea(viewingContent.id);
                    setViewingContentId(null);
                  }}
                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 text-on-surface-variant hover:text-error transition"
                  title="Hapus Ide Konten"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="w-px h-5 bg-outline/20 mx-1 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setIsContentMaximized(!isContentMaximized)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition hidden sm:inline-flex"
                  title={isContentMaximized ? 'Perkecil tampilan' : 'Perbesar layar penuh'}
                >
                  {isContentMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setViewingContentId(null)}
                  className="p-2 rounded-xl hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition"
                  title="Tutup (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notion Scrollable Body Area */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-8 md:px-10 py-5 sm:py-6 space-y-4">
              {/* Title Section */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={viewingContent.title}
                  onChange={(e) => updateContentIdea(viewingContent.id, { title: e.target.value })}
                  placeholder="Judul topik video / konten..."
                  className="w-full text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-on-surface bg-transparent focus:outline-none placeholder:text-outline-variant/60"
                />

                <div className="flex items-center gap-4 text-xs text-on-surface-variant py-2 border-y border-outline/15">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary-container" />
                    <span>
                      Dibuat: {new Date(viewingContent.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-primary-container" />
                    <span>Target: {viewingContent.platform}</span>
                  </div>
                </div>
              </div>

              {/* Hook Box Section */}
              <div className="p-4 sm:p-5 rounded-2xl bg-primary-fixed/25 border border-primary-container/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-primary-container uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hook 3 Detik Pembuka (First Impression)</span>
                </div>
                <textarea
                  rows={2}
                  value={viewingContent.hook_text || ''}
                  onChange={(e) => updateContentIdea(viewingContent.id, { hook_text: e.target.value })}
                  placeholder="Kalimat pembuka video yang langsung menarik perhatian audience..."
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface font-medium focus:outline-none resize-none placeholder:text-on-surface-variant/40 leading-relaxed"
                />
              </div>

              {/* SCRIPT FORMATTING TOOLBAR & VIEW MODE SWITCHER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-surface-container-low rounded-2xl border border-outline/25">
                <div className="flex items-center gap-1 overflow-x-auto py-0.5 px-1 scrollbar-none text-xs">
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '**', '**', 'teks tebal')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition font-bold"
                    title="Bold (**teks**)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '*', '*', 'teks miring')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition italic"
                    title="Italic (*teks*)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-px h-4 bg-outline/20 mx-0.5 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '\n1. ', '', 'Scene pertama')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Daftar Nomor"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '\n- ', '', 'Talking point')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Bullet Point"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '\n- [ ] ', '', 'Adegan / asset')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Checklist Asset"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '\n> ', '', 'Narasi audio')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Callout / Voiceover"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormat('content', '\n---\n')}
                    className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface hover:text-primary-container transition"
                    title="Pemisah Adegan"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1 p-0.5 bg-surface-container-high rounded-xl shrink-0 self-end sm:self-auto border border-outline/20">
                  <button
                    type="button"
                    onClick={() => setContentViewMode('edit')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      contentViewMode === 'edit'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Hanya Editor Naskah (Layar Penuh)"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Tulis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentViewMode('split')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      contentViewMode === 'split'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Split View (Editor + Pratinjau Naskah)"
                  >
                    <Columns className="w-3 h-3" />
                    <span>Split</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentViewMode('preview')}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      contentViewMode === 'preview'
                        ? 'bg-surface-container-lowest text-primary-container shadow-xs font-bold border border-outline/20'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title="Hanya Pratinjau Naskah (Layar Penuh)"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Pratinjau</span>
                  </button>
                </div>
              </div>

              {/* Script / Outline Editor (Split View vs Single View) */}
              <div className="space-y-2 flex flex-col flex-1 min-h-[380px] lg:min-h-[460px]">
                <div className="flex items-center justify-between text-xs font-bold text-on-surface uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-primary-container" />
                    <span>Outline &amp; Full Script Body</span>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-normal normal-case">
                    {(viewingContent.script_body || '').split(/\s+/).filter(Boolean).length} kata
                  </span>
                </div>

                {contentViewMode === 'split' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    {/* Left: Script Editor */}
                    <div className="flex flex-col rounded-2xl border border-outline/30 bg-surface-container-low/40 overflow-hidden focus-within:border-primary-container/80 transition shadow-inner">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <Edit3 className="w-3.5 h-3.5 text-primary-container" />
                          <span>Editor Naskah</span>
                        </div>
                        <span className="text-[10px] text-on-surface-variant/70">
                          {(viewingContent.script_body || '').length} karakter
                        </span>
                      </div>
                      <textarea
                        ref={contentTextareaRef}
                        value={viewingContent.script_body || ''}
                        onChange={(e) => updateContentIdea(viewingContent.id, { script_body: e.target.value })}
                        placeholder="Tuliskan breakdown adegan, poin-poin penjelasan, atau naskah lengkap di sini..."
                        className="w-full flex-1 p-4 sm:p-5 font-sans text-xs sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none min-h-[240px] md:min-h-[380px] placeholder:text-on-surface-variant/40"
                      />
                    </div>

                    {/* Right: Script Preview */}
                    <div className="flex flex-col rounded-2xl border border-outline/25 bg-surface-container-low/30 overflow-hidden shadow-xs">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                        <div className="flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-primary-container" />
                          <span>Pratinjau Script</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Sinkron</span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 flex-1 min-h-[240px] md:min-h-[380px] overflow-y-auto">
                        <MarkdownRenderer
                          content={viewingContent.script_body || ''}
                          onToggleCheckbox={handleToggleContentCheckbox}
                        />
                      </div>
                    </div>
                  </div>
                ) : contentViewMode === 'preview' ? (
                  <div className="flex flex-col rounded-2xl border border-outline/25 bg-surface-container-low/30 overflow-hidden shadow-xs flex-1">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-primary-container" />
                        <span>Pratinjau Naskah Rapi</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Format Aktif</span>
                      </div>
                    </div>
                    <div className="p-4 sm:p-6 flex-1 min-h-[300px] md:min-h-[380px] overflow-y-auto">
                      <MarkdownRenderer
                        content={viewingContent.script_body || ''}
                        onToggleCheckbox={handleToggleContentCheckbox}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col rounded-2xl border border-outline/30 bg-surface-container-low/50 overflow-hidden focus-within:border-primary-container/80 transition shadow-inner flex-1">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-outline/20 bg-surface-container-low/80 text-[11px] font-semibold text-on-surface-variant">
                      <div className="flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-primary-container" />
                        <span>Editor Naskah Penuh</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant/70">
                        {(viewingContent.script_body || '').length} karakter
                      </span>
                    </div>
                    <textarea
                      ref={contentTextareaRef}
                      value={viewingContent.script_body || ''}
                      onChange={(e) => updateContentIdea(viewingContent.id, { script_body: e.target.value })}
                      placeholder="Tuliskan breakdown adegan, poin-poin penjelasan, atau naskah lengkap di sini..."
                      className="w-full flex-1 p-4 sm:p-5 font-sans text-xs sm:text-sm leading-relaxed bg-transparent text-on-surface focus:outline-none resize-none min-h-[300px] md:min-h-[380px] placeholder:text-on-surface-variant/40"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
