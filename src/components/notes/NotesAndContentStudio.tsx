'use client';

import React, { useState } from 'react';
import { useNotesStore, NoteItem, ContentIdea } from '@/stores/useNotesStore';
import { BookOpen, Video, Pin, Plus, Trash2, Code, MessageSquare, Bookmark } from 'lucide-react';

export function NotesAndContentStudio() {
  const { notes, contentIdeas, addNote, deleteNote, togglePinNote, addContentIdea, updateContentStatus } =
    useNotesStore();

  const [activeTab, setActiveTab] = useState<'notes' | 'content'>('notes');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteItem['type']>('note');

  const [contentTitle, setContentTitle] = useState('');
  const [contentHook, setContentHook] = useState('');
  const [contentScript, setContentScript] = useState('');
  const [contentPlatform, setContentPlatform] = useState('TikTok/Reels');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    addNote({
      title: noteTitle,
      content: noteContent,
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
      title: contentTitle,
      hook_text: contentHook || null,
      script_body: contentScript || null,
      platform: contentPlatform,
      status: 'idea',
    });
    setContentTitle('');
    setContentHook('');
    setContentScript('');
  };

  return (
    <section className="space-y-6">
      
      {/* Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
            Second Brain &amp; Content Studio
          </h2>
          <p className="text-xs text-appleText-secondary mt-0.5">
            Notes repository, code snippets, AI prompts, and content creation studio.
          </p>
        </div>

        {/* Typographic Sub-tabs */}
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`pb-1 transition ${
              activeTab === 'notes'
                ? 'font-bold text-appleText-primary border-b-2 border-zinc-900'
                : 'text-appleText-muted hover:text-appleText-primary'
            }`}
          >
            Notes &amp; Snippets ({notes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('content')}
            className={`pb-1 transition ${
              activeTab === 'content'
                ? 'font-bold text-appleText-primary border-b-2 border-zinc-900'
                : 'text-appleText-muted hover:text-appleText-primary'
            }`}
          >
            Content Studio ({contentIdeas.length})
          </button>
        </div>
      </div>

      {activeTab === 'notes' ? (
        <div className="space-y-5">
          {/* Add Note Form */}
          <form onSubmit={handleCreateNote} className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                required
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note / snippet title..."
                className="sm:col-span-3 px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
              />
              <select
                value={noteType}
                onChange={(e) => setNoteType(e.target.value as any)}
                className="px-2 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-secondary focus:outline-none"
              >
                <option value="note">Note</option>
                <option value="snippet">Code Snippet</option>
                <option value="prompt">AI Prompt</option>
                <option value="bookmark">Bookmark</option>
              </select>
            </div>
            <textarea
              rows={2}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Note content or code snippet..."
              className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none font-mono text-xs"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition text-xs"
              >
                Save Note
              </button>
            </div>
          </form>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notes.map((n) => (
              <div
                key={n.id}
                className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-2 hover:shadow-appleHover transition"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-appleText-muted font-mono text-[11px]">
                    {n.type === 'snippet' && <Code className="w-3 h-3 text-purple-600" />}
                    {n.type === 'prompt' && <MessageSquare className="w-3 h-3 text-emerald-600" />}
                    {n.type === 'bookmark' && <Bookmark className="w-3 h-3 text-blue-600" />}
                    <span className="uppercase font-semibold">{n.type}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePinNote(n.id)}
                      className={`p-1 rounded ${n.is_pinned ? 'text-amber-500' : 'text-appleText-muted'}`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(n.id)}
                      className="p-1 rounded text-appleText-muted hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-semibold text-appleText-primary">{n.title}</h4>
                <div className="text-xs text-appleText-secondary font-mono bg-subtle p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                  {n.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Content Studio */
        <div className="space-y-5">
          {/* New Content Idea Form */}
          <form onSubmit={handleCreateContent} className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                value={contentTitle}
                onChange={(e) => setContentTitle(e.target.value)}
                placeholder="Title / Video or Article Topic..."
                className="sm:col-span-2 px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
              />
              <select
                value={contentPlatform}
                onChange={(e) => setContentPlatform(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-secondary focus:outline-none"
              >
                <option value="TikTok/Reels">TikTok / Instagram Reels</option>
                <option value="YouTube">YouTube</option>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Blog">Blog / Medium</option>
              </select>
            </div>
            <input
              type="text"
              value={contentHook}
              onChange={(e) => setContentHook(e.target.value)}
              placeholder="First 3-second hook (captivating opening line)..."
              className="w-full px-3 py-1.5 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none"
            />
            <textarea
              rows={2}
              value={contentScript}
              onChange={(e) => setContentScript(e.target.value)}
              placeholder="Script bullet points or caption..."
              className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:outline-none text-xs"
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition text-xs"
              >
                Save Content Idea
              </button>
            </div>
          </form>

          {/* Content Ideas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contentIdeas.map((idea) => (
              <div key={idea.id} className="bg-white p-4 rounded-lg border border-appleBorder shadow-apple space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-xs uppercase tracking-wider text-purple-700">
                    {idea.platform}
                  </span>
                  <select
                    value={idea.status}
                    onChange={(e) => updateContentStatus(idea.id, e.target.value as any)}
                    className="font-mono text-[11px] bg-subtle px-2 py-0.5 rounded border border-appleBorder text-appleText-secondary cursor-pointer"
                  >
                    <option value="idea">Idea</option>
                    <option value="scripting">Scripting</option>
                    <option value="filming">Filming</option>
                    <option value="editing">Editing</option>
                    <option value="posted">Posted</option>
                  </select>
                </div>

                <h4 className="text-sm font-semibold text-appleText-primary">{idea.title}</h4>

                {idea.hook_text && (
                  <div className="text-xs p-2 rounded bg-amber-50 border border-amber-100 text-amber-900 font-medium">
                    <span className="font-bold">Hook:</span> {idea.hook_text}
                  </div>
                )}

                {idea.script_body && (
                  <p className="text-xs text-appleText-secondary line-clamp-3 leading-relaxed">
                    {idea.script_body}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}

