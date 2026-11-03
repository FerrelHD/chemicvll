'use client';

import React, { useState, useEffect } from 'react';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import {
  CloudUpload,
  Copy,
  Check,
  Pin,
  Trash2,
  ExternalLink,
  Code,
  FileText,
  Send,
  Timer,
  Share2,
  FolderArchive,
  Flame,
  Plus,
  Terminal,
  Zap,
} from 'lucide-react';

export function DropzonePanel() {
  const { items, addItem, deleteItem, togglePin, purgeExpired } = useDropzoneStore();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'code' | 'links'>('all');

  // Automated 24-hour purge on mount
  useEffect(() => {
    purgeExpired();
  }, [purgeExpired]);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    addItem(input);
    setInput('');
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'code') return item.type === 'code';
    if (activeTab === 'links') return item.type === 'link';
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  // Quick scratchpad snippets
  const scratchpadSnippets = [
    { title: 'Docker Prune', cmd: 'docker system prune -af --volumes' },
    { title: 'Kill Port 3000', cmd: 'npx kill-port 3000' },
    { title: 'Supabase Migrations', cmd: 'supabase db push' },
    { title: 'Git Stash & Pull', cmd: 'git stash && git pull --rebase && git stash pop' },
  ];

  return (
    <section className="space-y-6">
      
      {/* Page Header & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Staging &amp; Quick Stash Hub
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            <span className="text-[11px] font-semibold text-primary-container">Active Session</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight">
            Dropzone <span className="text-primary-container">&amp; Berkas Sementara</span>
          </h1>
        </div>

        {/* Quick Actions Pill Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-surface-container-lowest px-3.5 py-1.5 rounded-full border border-outline/30 shadow-sm text-on-surface-variant text-xs font-medium">
            <Timer className="w-3.5 h-3.5 text-primary-container" />
            <span>Auto-purge: <strong className="text-on-surface">24 Jam</strong></span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('Bersihkan semua berkas sementara yang tidak disematkan?')) {
                items.filter((i) => !i.is_pinned).forEach((i) => deleteItem(i.id));
              }
            }}
            className="flex items-center gap-1.5 bg-surface-container-lowest hover:bg-surface-container-high text-on-surface px-3.5 py-1.5 rounded-full border border-outline/30 shadow-sm text-xs font-semibold transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Bersihkan Cache</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Metric Bento Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Storage Capacity */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Kapasitas Stash</span>
            <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface">
              <FolderArchive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-on-surface font-sans">
                1.2 <span className="text-xs text-on-surface-variant font-normal">/ 10 GB</span>
              </span>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[11px] text-primary-container font-bold">
                12%
              </span>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
              <div className="bg-primary-container h-full rounded-full" style={{ width: '12%' }} />
            </div>
            <span className="text-xs text-on-surface-variant mt-1">
              {items.length} berkas &amp; catatan tersimpan
            </span>
          </div>
        </div>

        {/* Metric 2: Active Links */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Tautan Sinkronisasi</span>
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface font-sans">
                {items.filter((i) => i.type === 'link').length}
              </span>
              <span className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full text-[11px] text-purple-600 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse" />
                Live Sync
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-1">
              Lintas PC dan Smartphone (PWA)
            </span>
          </div>
        </div>

        {/* Metric 3: Expiring Soon */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Segera Hangus</span>
            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface font-sans">
                {items.filter((i) => !i.is_pinned).length}
              </span>
              <span className="bg-rose-50 text-rose-600 text-[11px] px-2 py-0.5 rounded-full font-semibold">
                &lt; 24 Jam
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-1">
              Sematkan pin agar tidak terhapus otomatis
            </span>
          </div>
        </div>

        {/* Metric 4: Code Snippets */}
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] flex flex-col justify-between hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant">Klip Kode / Snippet</span>
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container">
              <Code className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-on-surface font-sans">
                {items.filter((i) => i.type === 'code').length}
              </span>
              <span className="bg-surface-container-high px-2 py-0.5 rounded-full text-[11px] text-on-surface font-semibold">
                Tersimpan
              </span>
            </div>
            <span className="text-xs text-on-surface-variant mt-1">
              1-klik salin ke terminal
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Staging Input & Quick Scratchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Input & Dropzone Items (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Quick Input Bar */}
          <div className="bg-surface-container-lowest p-4 rounded-3xl border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)]">
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ketik atau tempel teks, URL, perintah cURL, atau cuplikan kode..."
                className="flex-1 px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline/30 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-inverse-surface text-white text-xs font-semibold hover:bg-black transition shadow-sm active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
            </form>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-surface-container-high p-1 rounded-full w-fit text-xs font-semibold">
            {(['all', 'code', 'links'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full capitalize transition ${
                  activeTab === tab
                    ? 'bg-surface-container-lowest text-on-surface shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab === 'all' ? 'Semua Stash' : tab === 'code' ? 'Kode / Snippet' : 'Tautan Link'}
              </button>
            ))}
          </div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedItems.length === 0 ? (
              <div className="col-span-2 p-8 text-center bg-surface-container-lowest rounded-3xl border border-dashed border-outline/30 text-xs text-on-surface-variant">
                Dropzone kosong. Tempelkan tautan atau cuplikan teks di atas.
              </div>
            ) : (
              sortedItems.map((item) => {
                const isCopied = copiedId === item.id;
                const isLink = item.type === 'link';
                const isCode = item.type === 'code';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-3xl border bg-surface-container-lowest shadow-[0_1px_3px_rgba(24,24,27,0.03)] hover:shadow-md transition flex flex-col justify-between gap-3 ${
                      item.is_pinned ? 'border-primary-container/40 ring-1 ring-primary-container/20' : 'border-outline/30'
                    }`}
                  >
                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-outline/10">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant">
                          {isLink && <ExternalLink className="w-3 h-3 text-blue-600" />}
                          {isCode && <Code className="w-3 h-3 text-primary-container" />}
                          {!isLink && !isCode && <FileText className="w-3 h-3 text-zinc-500" />}
                          <span className="uppercase font-semibold">{item.type}</span>
                          <span>•</span>
                          <span>{item.device_source}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => togglePin(item.id)}
                            className={`p-1 rounded-full hover:bg-surface-container-high transition ${
                              item.is_pinned ? 'text-primary-container' : 'text-on-surface-variant'
                            }`}
                            title={item.is_pinned ? 'Lepas Pin' : 'Sematkan ke atas'}
                          >
                            <Pin className="w-3.5 h-3.5 fill-current" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteItem(item.id)}
                            className="p-1 rounded-full text-on-surface-variant hover:text-error hover:bg-surface-container-high transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="pt-2">
                        {isCode ? (
                          <pre className="p-2.5 rounded-xl bg-surface-container-low text-xs font-mono text-on-surface overflow-x-auto">
                            <code>{item.content}</code>
                          </pre>
                        ) : isLink ? (
                          <a
                            href={item.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all font-medium flex items-center gap-1"
                          >
                            <span className="truncate">{item.content}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        ) : (
                          <p className="text-xs text-on-surface whitespace-pre-wrap leading-relaxed">
                            {item.content}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Copy Footer */}
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.content)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high hover:bg-surface-dim text-xs font-medium text-on-surface transition"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Disalin</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Quick Code Scratchpad (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline/30 shadow-[0_1px_3px_rgba(24,24,27,0.03)] space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary-container" />
              <h3 className="text-sm font-bold text-on-surface">Quick Code Scratchpad</h3>
            </div>
            <p className="text-xs text-on-surface-variant">
              Snippet perintah developer harian. Klik untuk langsung menyalin ke clipboard.
            </p>

            <div className="space-y-2.5">
              {scratchpadSnippets.map((snip) => (
                <div
                  key={snip.title}
                  onClick={() => {
                    navigator.clipboard.writeText(snip.cmd);
                    setCopiedId(snip.title);
                    setTimeout(() => setCopiedId(null), 1500);
                  }}
                  className="p-3 rounded-2xl bg-surface-container-low border border-outline/20 hover:border-outline/40 transition cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-on-surface">{snip.title}</span>
                    <span className="text-[10px] text-on-surface-variant font-mono group-hover:text-primary-container transition">
                      {copiedId === snip.title ? 'Disalin!' : 'Klik salin'}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] font-mono text-on-surface-variant truncate">
                    {snip.cmd}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
