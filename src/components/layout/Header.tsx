'use client';

import React from 'react';
import { Command } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur-md border-b border-appleBorder/80 px-4 md:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ⌘
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-sm tracking-tight text-appleText-primary">
              Personal OS
            </span>
            <span className="font-mono text-xs text-appleText-muted">
              / chemicvll
            </span>
          </div>
        </div>

        {/* Quick Utilities */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-appleBorder text-xs font-mono text-appleText-secondary shadow-apple">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>Cloud Sync</span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white hover:bg-subtle border border-appleBorder text-xs text-appleText-secondary shadow-apple transition active:scale-95"
            onClick={() => {
              // Future Cmd+K handler trigger
              window.dispatchEvent(new CustomEvent('open-command-bar'));
            }}
          >
            <Command className="w-3 h-3 text-appleText-muted" />
            <span className="font-mono text-[11px] text-appleText-muted">⌘K</span>
          </button>
        </div>
      </div>
    </header>
  );
}

