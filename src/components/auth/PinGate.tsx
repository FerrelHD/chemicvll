'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Check } from 'lucide-react';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
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
      setIsSuccess(false);
      setError(false);
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

  const triggerSuccess = () => {
    setIsSuccess(true);
    setError(false);
    try {
      localStorage.setItem('personal_os_unlocked', 'true');
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
    setTimeout(() => {
      setIsUnlocked(true);
      if (typeof window !== 'undefined') window.scrollTo(0, 0);
    }, 550);
  };

  const triggerError = () => {
    setError(true);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin('');
      inputRef.current?.focus();
    }, 450);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSuccess) return;

    if (pin.trim() === EXPECTED_PIN) {
      triggerSuccess();
    } else {
      triggerError();
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSuccess) return;
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError(false);

    if (val.length === 4) {
      if (val === EXPECTED_PIN) {
        triggerSuccess();
      } else {
        triggerError();
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
    <AnimatePresence mode="wait">
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-container-low p-4 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className="w-full max-w-[340px] bg-surface-container-lowest p-6 sm:p-7 rounded-2xl border border-outline/40 flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold text-on-surface tracking-tight">
                {isSuccess ? 'Access granted' : 'Enter Master PIN'}
              </h1>
              <p className="text-xs text-on-surface-variant">
                {isSuccess
                  ? 'Opening workspace...'
                  : 'Enter your 4-digit PIN to unlock.'}
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-200 ${
                isSuccess
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-surface-container-low border-outline/40 text-on-surface-variant'
              }`}
            >
              {isSuccess ? (
                <Unlock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
          </div>

          {/* PIN Input & Digit Slots */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                aria-label="Master PIN"
                value={pin}
                onChange={handlePinChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={isSuccess}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                autoComplete="off"
              />

              <motion.div
                animate={isShaking ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
                transition={{ duration: 0.32 }}
                className="grid grid-cols-4 gap-2.5"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  const active = isFocused && !isSuccess && pin.length === idx;
                  return (
                    <div
                      key={idx}
                      className={`h-12 rounded-xl border flex items-center justify-center text-lg font-semibold transition-colors duration-150 ${
                        isSuccess
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : error
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : active
                          ? 'border-primary-container bg-surface-container-lowest ring-2 ring-primary-container/25 text-on-surface'
                          : filled
                          ? 'border-outline/70 bg-surface-container-low text-on-surface'
                          : 'border-outline/35 bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {isSuccess ? (
                        <Check className="w-4 h-4 text-white stroke-[2.5]" />
                      ) : filled ? (
                        '•'
                      ) : (
                        ''
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {error && (
              <p className="text-xs text-rose-600 font-medium">
                Incorrect PIN. Try again.
              </p>
            )}

            <button
              type="submit"
              disabled={isSuccess || pin.length === 0}
              className={`w-full h-10 px-4 rounded-xl text-xs font-semibold transition-colors duration-150 flex items-center justify-center gap-1.5 ${
                isSuccess
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-inverse-surface hover:bg-black text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.99]'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Unlocked</span>
                </>
              ) : (
                <span>Unlock</span>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
