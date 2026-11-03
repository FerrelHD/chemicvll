'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Lock, ShieldCheck, ArrowRight, KeyRound } from 'lucide-react';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const EXPECTED_PIN = process.env.NEXT_PUBLIC_APP_PIN || '2026';

  useEffect(() => {
    try {
      const unlocked = localStorage.getItem('personal_os_unlocked') === 'true';
      setIsUnlocked(unlocked);
    } catch {
      setIsUnlocked(false);
    }

    const handleLock = () => {
      try {
        localStorage.removeItem('personal_os_unlocked');
      } catch {
        // Ignore
      }
      setIsUnlocked(false);
      setPin('');
    };

    window.addEventListener('personal_os_lock', handleLock);
    return () => window.removeEventListener('personal_os_lock', handleLock);
  }, []);

  useEffect(() => {
    if (isUnlocked === false) {
      inputRef.current?.focus();
    }
  }, [isUnlocked]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pin.trim() === EXPECTED_PIN) {
      try {
        localStorage.setItem('personal_os_unlocked', 'true');
      } catch {
        // Ignore
      }
      setError(false);
      setIsUnlocked(true);
    } else {
      setError(true);
      setPin('');
      inputRef.current?.focus();
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError(false);
    if (val.length === 4) {
      if (val === EXPECTED_PIN) {
        try {
          localStorage.setItem('personal_os_unlocked', 'true');
        } catch {
          // Ignore
        }
        setIsUnlocked(true);
      } else {
        setError(true);
        setTimeout(() => setPin(''), 400);
      }
    }
  };

  // Prevent flash while checking localStorage
  if (isUnlocked === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-surface-container-low">
        <div className="w-8 h-8 rounded-full border-2 border-primary-container border-t-transparent animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-low p-4 font-sans">
      {/* Subtle ambient blur */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm bg-surface-container-lowest p-8 rounded-3xl border border-outline/30 shadow-[0_8px_32px_rgba(24,24,27,0.06)] flex flex-col items-center text-center space-y-6">
        {/* Lock Icon Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline/30 flex items-center justify-center text-primary-container shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
            <span>Personal OS • Security Gate</span>
          </div>
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            Enter Master PIN
          </h2>
          <p className="text-xs text-on-surface-variant">
            Unlock your workspace, finances, and pipeline sync.
          </p>
        </div>

        {/* PIN Input & Visual Digits */}
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="relative flex justify-center items-center">
            {/* Hidden actual input */}
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              autoComplete="off"
            />

            {/* 4 Visual Digit Circles */}
            <div className="flex items-center gap-3.5">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-all ${
                      error
                        ? 'border-rose-400 bg-rose-50 text-rose-600 animate-shake'
                        : filled
                        ? 'border-primary-container bg-primary-fixed/30 text-on-surface scale-105 shadow-sm'
                        : 'border-outline/40 bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {filled ? '•' : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-semibold animate-in fade-in">
              Incorrect PIN. Please try again.
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-full bg-inverse-surface hover:bg-black text-white text-xs font-semibold shadow-sm transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>Unlock Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Security badge footer */}
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
          <span>Device remember active for this session</span>
        </div>
      </div>
    </div>
  );
}
