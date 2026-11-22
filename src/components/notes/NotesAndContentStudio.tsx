'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotesStore, NoteItem, ContentIdea } from '@/stores/useNotesStore';
import { LedgerNoteMark } from '@/components/icons/ChemicIcons';
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
  Layers,
  Send,
  ChevronDown,
  Pencil,
  X,
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
  } = useNotesStore();

  const [activeTab, setActiveTab] = useState<'notes' | 'content'>('notes');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Note form state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteItem['type']>('note');

  // Content idea form state
  const [contentTitle, setContentTitle] = useState('');
  const [contentHook, setContentHook] = useState('');
  const [contentScript, setContentScript] = useState('');
  const [contentPlatform, setContentPlatform] = useState('TikTok/Reels');

  // Edit Note Modal state
  const [mounted, setMounted] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<NoteItem['type']>('note');
  const [editTags, setEditTags] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleStartEdit = (note: NoteItem) => {
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditType(note.type);
    setEditTags(note.tags.join(', '));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote || !editTitle.trim() || !editContent.trim()) return;
    const tags = editTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    updateNote(editingNote.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
      type: editType,
      tags,
    });
    setEditingNote(null);
  };

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
              Repositori catatan teknis, AI prompts, code snippets, dan pipeline ide konten video.
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
              placeholder="Isi catatan, command terminal, atau prompt AI..."
              className="w-full px-3.5 py-2.5 rounded-2xl border border-outline/30 bg-surface-container-low text-on-surface focus:outline-none focus:border-primary-container font-mono text-xs leading-relaxed resize-none"
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
                className={`bg-surface-container-lowest p-4 rounded-3xl border shadow-bento space-y-3 transition-all hover:shadow-bentoHover ${
                  n.is_pinned ? 'border-primary-container/40 ring-1 ring-primary-container/20' : 'border-outline/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                    {n.type === 'snippet' && <Code className="w-3.5 h-3.5 text-purple-600" />}
                    {n.type === 'prompt' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                    {n.type === 'bookmark' && <Bookmark className="w-3.5 h-3.5 text-blue-600" />}
                    {n.type === 'note' && <BookOpen className="w-3.5 h-3.5 text-amber-600" />}
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                      {n.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(n.id, n.content)}
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
                      onClick={() => handleStartEdit(n)}
                      className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-primary-container transition-colors"
                      title="Edit note"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePinNote(n.id)}
                      className={`p-1.5 rounded-full hover:bg-surface-container transition-colors ${
                        n.is_pinned ? 'text-primary-container bg-primary-fixed/40' : 'text-on-surface-variant'
                      }`}
                      title={n.is_pinned ? 'Unpin' : 'Pin note'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      className="p-1.5 rounded-full hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors"
                      title="Hapus note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-on-surface leading-tight">{n.title}</h4>

                <div className="text-xs text-on-surface-variant font-mono bg-surface-container-low p-3 rounded-2xl whitespace-pre-wrap max-h-40 overflow-y-auto border border-outline/20 leading-relaxed">
                  {n.content}
                </div>
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
                className="bg-surface-container-lowest p-5 rounded-3xl border border-outline/30 shadow-bento space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                    <span className="font-bold text-[11px] uppercase tracking-wider text-purple-600 bg-purple-500/10 px-2.5 py-0.5 rounded-full">
                      {idea.platform}
                    </span>
                    <div className="relative">
                      <select
                        value={idea.status}
                        onChange={(e) => updateContentStatus(idea.id, e.target.value as any)}
                        className="appearance-none font-mono text-[11px] bg-surface-container-high hover:bg-surface-dim px-2.5 py-1 pr-6 rounded-xl border border-outline/30 text-on-surface cursor-pointer font-semibold outline-none transition-colors"
                      >
                        <option value="idea">💡 Idea</option>
                        <option value="scripting">📝 Scripting</option>
                        <option value="filming">🎬 Filming</option>
                        <option value="editing">✂️ Editing</option>
                        <option value="posted">✅ Posted</option>
                      </select>
                      <ChevronDown className="w-3 h-3 text-on-surface-variant pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-on-surface leading-tight">{idea.title}</h4>

                  {idea.hook_text && (
                    <div className="text-xs p-3 rounded-2xl bg-primary-fixed/30 border border-primary-container/20 text-on-surface font-medium">
                      <span className="font-bold text-primary-container">Hook:</span> "{idea.hook_text}"
                    </div>
                  )}

                  {idea.script_body && (
                    <p className="text-xs text-on-surface-variant line-clamp-4 leading-relaxed bg-surface-container-low p-3 rounded-2xl border border-outline/20">
                      {idea.script_body}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-outline/10 flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>Dibuat: {new Date(idea.created_at).toLocaleDateString('id-ID')}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(idea.id, `${idea.title}\n\nHook: ${idea.hook_text || '-'}\n\n${idea.script_body || ''}`)}
                    className="hover:text-primary-container flex items-center gap-1 font-semibold"
                  >
                    {copiedId === idea.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedId === idea.id ? 'Tersalin' : 'Salin Script'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Edit Note Modal */}
      {editingNote && mounted && createPortal(
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface-container-lowest rounded-t-3xl sm:rounded-3xl border border-outline/30 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:pb-6 space-y-4">
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto sm:hidden -mt-1 mb-1" />

            <div className="flex items-center justify-between pb-3 border-b border-outline/20">
              <h3 className="font-bold text-sm text-on-surface">Edit Catatan</h3>
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Judul Catatan *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Tipe Catatan
                  </label>
                  <div className="relative">
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value as NoteItem['type'])}
                      className="w-full appearance-none bg-surface-container-low border border-outline/30 rounded-xl px-3.5 py-2 pr-8 text-xs font-semibold text-on-surface outline-none focus:border-primary-container"
                    >
                      <option value="note">📝 Note</option>
                      <option value="snippet">⚡ Code Snippet</option>
                      <option value="prompt">🤖 AI Prompt</option>
                      <option value="bookmark">🔖 Bookmark</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Tags (pisahkan koma)
                  </label>
                  <input
                    type="text"
                    placeholder="ai, interview, react"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">
                  Konten Catatan *
                </label>
                <textarea
                  required
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl p-3 text-xs font-mono text-on-surface focus:outline-none focus:border-primary-container resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-outline/20">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white font-semibold shadow-sm text-xs active:scale-95 transition-all"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
