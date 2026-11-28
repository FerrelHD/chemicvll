'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCommandStore } from '@/stores/useCommandStore';
import { parseCommand } from '@/lib/command-parser';
import { useCareerStore } from '@/stores/useCareerStore';
import { exportAllDataAsJson } from '@/lib/backup-export';
import { Command, CornerDownLeft, X, ArrowRight } from 'lucide-react';

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
        notes: 'Added via Command Bar ⌘K',
      });
      onShowNotice?.(`Application for ${parsed.entity} (${parsed.role}) recorded.`);
      close();
    } else if (parsed.type === 'nav') {
      onNavigate?.(parsed.target);
      onShowNotice?.(`Navigated to ${parsed.target}`);
      close();
    } else if (parsed.type === 'task') {
      window.dispatchEvent(new CustomEvent('quick-add-task', { detail: parsed }));
      onShowNotice?.(`Task "${parsed.title}" added to Inbox.`);
      close();
    } else if (parsed.type === 'expense') {
      window.dispatchEvent(new CustomEvent('quick-add-expense', { detail: parsed }));
      onShowNotice?.(`Expense Rp ${parsed.amount.toLocaleString('id-ID')} recorded.`);
      close();
    } else if (
      input.trim().toLowerCase() === '/backup' ||
      input.trim().toLowerCase() === '/export'
    ) {
      exportAllDataAsJson();
      onShowNotice?.('File backup database JSON berhasil diunduh.');
      close();
    } else if (
      input.trim().toLowerCase() === '/theme' ||
      input.trim().toLowerCase() === '/dark' ||
      input.trim().toLowerCase() === '/light'
    ) {
      const isCurrentlyDark = document.documentElement.classList.contains('dark');
      const nextDark = !isCurrentlyDark;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        try {
          localStorage.setItem('chemicvll_theme', 'dark');
        } catch {}
      } else {
        document.documentElement.classList.remove('dark');
        try {
          localStorage.setItem('chemicvll_theme', 'light');
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { dark: nextDark } }));
      onShowNotice?.(`Switched to ${nextDark ? 'Warm Obsidian Dark Mode' : 'Warm Linen Light Mode'}`);
      close();
    } else {
      setFeedback(`Unknown command. Try /apply, /task, /exp, or /theme.`);
    }
  };

  const suggestions = [
    { cmd: '/backup', desc: 'Download full database JSON snapshot' },
    { cmd: '/theme', desc: 'Toggle Dark Mode (Warm Obsidian)' },
    { cmd: '/apply GoTo - Frontend Intern #internship', desc: 'Quick record internship application' },
    { cmd: '/task Review feedback HR !high', desc: 'Add P1 daily focus task' },
    { cmd: '/exp 35000 Lunch Bento #bca', desc: 'Record instant expense' },
    { cmd: 'career', desc: 'Jump to Career Pipeline' },
    { cmd: 'finance', desc: 'Open Financial Vault' },
    { cmd: 'dropzone', desc: 'Open Staging Dropzone' },
  ];

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[70] flex items-start justify-center pt-6 sm:pt-20 px-3 sm:px-4 pb-4 bg-black/40 backdrop-blur-sm animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-3xl border border-outline/30 shadow-2xl max-w-xl w-full max-h-[calc(100dvh-2.5rem)] sm:max-h-[82vh] flex flex-col overflow-hidden space-y-0"
      >
        
        {/* Input Bar */}
        <form onSubmit={handleExecute} className="flex items-center px-3.5 sm:px-5 py-3.5 sm:py-4 border-b border-outline/20 gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container shrink-0">
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
            placeholder="Type a command or shortcut... (e.g. /apply Google - SWE)"
            className="flex-1 min-w-0 bg-transparent text-base sm:text-sm text-on-surface focus:outline-none placeholder:text-on-surface-variant font-sans"
          />
          <button
            type="submit"
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-inverse-surface dark:bg-primary-container hover:bg-black dark:hover:bg-primary text-white text-xs font-semibold transition shrink-0"
          >
            <span className="hidden sm:inline">Enter</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Close command bar"
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Feedback or Hints */}
        {feedback && (
          <div className="px-4 sm:px-5 py-2.5 bg-rose-50 border-b border-rose-100 text-xs text-rose-800 font-medium shrink-0">
            {feedback}
          </div>
        )}

        {/* Suggestion List */}
        <div className="p-3 sm:p-3.5 space-y-1 flex-1 min-h-0 overflow-y-auto">
          <div className="px-3 py-1 text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
            Quick Actions &amp; Suggestions
          </div>
          {suggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setInput(item.cmd);
                inputRef.current?.focus();
              }}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-3.5 py-2 rounded-2xl hover:bg-surface-container-high text-left transition group"
            >
              <span className="font-mono text-xs text-on-surface font-medium group-hover:text-primary-container truncate max-w-full">
                {item.cmd}
              </span>
              <span className="text-[11px] sm:text-xs text-on-surface-variant flex items-center gap-1 sm:shrink-0 break-words">
                {item.desc}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </span>
            </button>
          ))}
        </div>

        {/* Bottom footer hint */}
        <div className="px-5 py-2.5 bg-surface-container-low border-t border-outline/20 flex items-center justify-between text-[11px] text-on-surface-variant">
          <span>Press Esc to close</span>
          <span className="font-mono">Personal OS chemicv11</span>
        </div>

      </div>
    </div>
  );
}
