'use client';

import React, { useState } from 'react';
import { useDropzoneStore } from '@/stores/useDropzoneStore';
import { Copy, Check, Pin, Trash2, Link as LinkIcon, Code, FileText, Send } from 'lucide-react';

export function DropzonePanel() {
  const { items, addItem, deleteItem, togglePin } = useDropzoneStore();
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Sort pinned first
  const sortedItems = [...items].sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0));

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight text-appleText-primary">
          Realtime Dropzone
        </h2>
        <p className="text-xs text-appleText-secondary mt-0.5">
          Sinkronisasi clipboard lintas perangkat (PC ke HP dan sebaliknya).
        </p>
      </div>

      {/* Quick Input Bar */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ketik atau tempel teks, link, atau cuplikan kode..."
          className="flex-1 px-3.5 py-2 rounded-lg border border-appleBorder bg-white text-xs text-appleText-primary focus:outline-none focus:ring-1 focus:ring-zinc-800 shadow-apple"
        />
        <button
          type="submit"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-900 text-white text-xs font-medium hover:bg-black transition shadow-sm active:scale-95"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>

      {/* Item List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedItems.map((item) => {
          const isCopied = copiedId === item.id;
          const isLink = item.type === 'link';
          const isCode = item.type === 'code';

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-lg border bg-white shadow-apple hover:shadow-appleHover transition-all space-y-2 ${
                item.is_pinned ? 'border-zinc-400 bg-zinc-50/50' : 'border-appleBorder'
              }`}
            >
              {/* Card Meta */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-appleText-muted font-mono text-[11px]">
                  {isLink && <LinkIcon className="w-3 h-3 text-blue-600" />}
                  {isCode && <Code className="w-3 h-3 text-purple-600" />}
                  {!isLink && !isCode && <FileText className="w-3 h-3 text-zinc-600" />}
                  <span className="uppercase">{item.type}</span>
                  <span>•</span>
                  <span>{item.device_source}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => togglePin(item.id)}
                    className={`p-1 rounded hover:bg-zinc-100 transition ${
                      item.is_pinned ? 'text-zinc-900 font-bold' : 'text-appleText-muted'
                    }`}
                    title={item.is_pinned ? 'Lepas Pin' : 'Sematkan ke atas'}
                  >
                    <Pin className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="p-1 rounded text-appleText-muted hover:text-red-600 hover:bg-zinc-100 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Content Body */}
              <div className="text-xs text-appleText-primary break-all">
                {isLink ? (
                  <a
                    href={item.content}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#0066CC] hover:underline font-mono text-xs"
                  >
                    {item.content}
                  </a>
                ) : isCode ? (
                  <pre className="p-2 rounded bg-zinc-100 text-zinc-800 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                    {item.content}
                  </pre>
                ) : (
                  <p className="leading-relaxed">{item.content}</p>
                )}
              </div>

              {/* Copy Action */}
              <div className="pt-2 border-t border-zinc-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleCopy(item.id, item.content)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition ${
                    isCopied
                      ? 'bg-emerald-100 text-emerald-800 font-medium'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-appleText-secondary'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-700" />
                      <span>Tersalin!</span>
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
        })}
      </div>
    </section>
  );
}

