'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCommandStore } from '@/stores/useCommandStore';
import { parseCommand } from '@/lib/command-parser';
import { useCareerStore } from '@/stores/useCareerStore';
import { Command, CornerDownLeft, Sparkles, X, ArrowRight } from 'lucide-react';

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
        platform_source: '⌘K Quick Add',
        work_type: 'hybrid',
        location: 'Jakarta (hybrid)',
        resume_version: 'CV-SE-v2.pdf',
        stipend_or_salary: null,
        contact_person: null,
        next_follow_up_date: null,
        portal_url: null,
        notes: 'Ditambahkan via Command Bar ⌘K',
      });
      onShowNotice?.(`Lamaran ${parsed.entity} (${parsed.role}) berhasil dicatat.`);
      close();
    } else if (parsed.type === 'nav') {
      onNavigate?.(parsed.target);
      onShowNotice?.(`Berpindah ke halaman ${parsed.target}`);
      close();
    } else if (parsed.type === 'task') {
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
    { cmd: '/task Review feedback HR !high', desc: 'Tambah prioritas harian P1' },
    { cmd: '/exp 35000 Makan Siang #bca', desc: 'Catat pengeluaran instan' },
    { cmd: 'karir', desc: 'Lompat ke Pelacak Karir' },
    { cmd: 'keuangan', desc: 'Buka Manajemen Finansial' },
    { cmd: 'dropzone', desc: 'Buka Staging Dropzone' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline/30 shadow-2xl max-w-xl w-full overflow-hidden space-y-0">
        
        {/* Input Bar */}
        <form onSubmit={handleExecute} className="flex items-center px-5 py-4 border-b border-outline/20 gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
            <Command className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setFeedback(null);
            }}
            placeholder="Ketik perintah atau shortcut... (contoh: /apply Google - SWE)"
            className="flex-1 bg-transparent text-xs text-on-surface focus:outline-none placeholder:text-on-surface-variant font-sans"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold transition"
          >
            <span>Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={close}
            className="w-7 h-7 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Feedback or Hints */}
        {feedback && (
          <div className="px-5 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-800 font-medium">
            {feedback}
          </div>
        )}

        {/* Suggestion List */}
        <div className="p-3.5 space-y-1 max-h-64 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Saran &amp; Perintah Cepat
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(item.cmd);
                inputRef.current?.focus();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl hover:bg-surface-container-high text-left transition group"
            >
              <span className="font-mono text-xs text-on-surface font-medium group-hover:text-primary-container">
                {item.cmd}
              </span>
              <span className="text-xs text-on-surface-variant flex items-center gap-1">
                {item.desc}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          ))}
        </div>

        {/* Bottom footer hint */}
        <div className="px-5 py-2.5 bg-surface-container-low border-t border-outline/20 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>Tekan Esc untuk menutup</span>
          <span className="font-mono">Personal OS chemicv11</span>
        </div>

      </div>
    </div>
  );
}
