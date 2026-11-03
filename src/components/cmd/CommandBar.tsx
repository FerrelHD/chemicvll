'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCommandStore } from '@/stores/useCommandStore';
import { parseCommand } from '@/lib/command-parser';
import { useCareerStore } from '@/stores/useCareerStore';
import { Command, Search, CornerDownLeft, Sparkles, X } from 'lucide-react';

interface CommandBarProps {
  onNavigate?: (tab: string) => void;
  onShowNotice?: (msg: string) => void;
}

export function CommandBar({ onNavigate, onShowNotice }: CommandBarProps) {
  const { isOpen, close, toggle } = useCommandStore();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const addCareerItem = useCareerStore((state) => state.addItem);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    const handleCustomOpen = () => toggle();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-bar', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-bar', handleCustomOpen);
    };
  }, [isOpen, toggle, close]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setInput('');
      setFeedback(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const parsed = parseCommand(input);

    if (parsed.type === 'apply') {
      addCareerItem({
        entity_name: parsed.entity,
        role_or_program: parsed.role,
        category: parsed.category,
        stage: 'applied',
        applied_date: new Date().toISOString(),
        deadline: null,
        platform_source: 'Cmd+K Quick Add',
        work_type: 'hybrid',
        location: null,
        resume_version: null,
        stipend_or_salary: null,
        contact_person: null,
        next_follow_up_date: null,
        portal_url: null,
        notes: 'Ditambahkan via Command Bar',
      });
      onShowNotice?.(`Lamaran ${parsed.entity} (${parsed.role}) berhasil dicatat.`);
      close();
    } else if (parsed.type === 'nav') {
      onNavigate?.(parsed.target);
      onShowNotice?.(`Berpindah ke halaman ${parsed.target}`);
      close();
    } else if (parsed.type === 'task') {
      // Dispatches custom event for Task store
      window.dispatchEvent(new CustomEvent('quick-add-task', { detail: parsed }));
      onShowNotice?.(`Tugas "${parsed.title}" ditambahkan ke Inbox.`);
      close();
    } else if (parsed.type === 'expense') {
      window.dispatchEvent(new CustomEvent('quick-add-expense', { detail: parsed }));
      onShowNotice?.(`Pengeluaran Rp ${parsed.amount.toLocaleString('id-ID')} dicatat.`);
      close();
    } else {
      setFeedback(`Perintah tidak dikenal. Coba gunakan /apply, /task, atau /exp.`);
    }
  };

  const suggestions = [
    { cmd: '/apply GoTo - Frontend Intern #internship', desc: 'Catat lamaran magang kilat' },
    { cmd: '/task Review feedback HR !high', desc: 'Tambah prioritas harian' },
    { cmd: '/exp 35000 Makan Siang #bca', desc: 'Catat pengeluaran instan' },
    { cmd: 'karir', desc: 'Lompat ke Pelacak Karir' },
    { cmd: 'dropzone', desc: 'Buka Realtime Dropzone' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-appleBorder shadow-2xl max-w-xl w-full overflow-hidden space-y-0">
        
        {/* Input Bar */}
        <form onSubmit={handleExecute} className="flex items-center px-4 py-3 border-b border-zinc-100 gap-3">
          <Command className="w-4 h-4 text-appleText-muted" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFeedback(null);
            }}
            placeholder="Ketik perintah atau shortcut... (contoh: /apply Google - SWE)"
            className="flex-1 bg-transparent text-sm text-appleText-primary focus:outline-none placeholder:text-appleText-muted font-sans"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-appleText-secondary text-xs font-mono transition"
          >
            <span>Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={close}
            className="p-1 rounded text-appleText-muted hover:text-appleText-primary"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Feedback or Hints */}
        {feedback && (
          <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
            {feedback}
          </div>
        )}

        {/* Suggestion List */}
        <div className="p-3 space-y-1 max-h-60 overflow-y-auto">
          <div className="px-2 py-1 text-[11px] font-mono text-appleText-muted uppercase tracking-wider">
            Saran & Contoh Perintah
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(item.cmd);
                inputRef.current?.focus();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-subtle text-left transition group"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-appleText-primary font-medium group-hover:text-[#0066CC]">
                  {item.cmd}
                </span>
              </div>
              <span className="text-xs text-appleText-muted">{item.desc}</span>
            </button>
          ))}
        </div>

        {/* Bottom footer hint */}
        <div className="px-4 py-2 bg-[#F8F9FA] border-t border-zinc-100 flex items-center justify-between text-[11px] text-appleText-muted font-mono">
          <span>Esc untuk keluar</span>
          <span>Personal OS v0.1</span>
        </div>

      </div>
    </div>
  );
}

