'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldCheck, ArrowRight, Check } from 'lucide-react';

interface PinGateProps {
  children: React.ReactNode;
}

export function PinGate({ children }: PinGateProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
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
        {/* Subtle ambient blur */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            scale: 0.95,
            transition: { duration: 0.25 },
          }}
          className="relative w-full max-w-sm bg-surface-container-lowest p-8 rounded-3xl border border-outline/30 shadow-[0_8px_32px_rgba(24,24,27,0.06)] flex flex-col items-center text-center space-y-6"
        >
          {/* Lock / Unlock Icon Emblem */}
          <motion.div
            animate={{
              scale: isSuccess ? [1, 1.15, 1] : 1,
              rotate: isSuccess ? [0, -10, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
            className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-colors duration-300 shadow-sm ${
              isSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                : 'bg-surface-container-high border-outline/30 text-primary-container'
            }`}
          >
            {isSuccess ? (
              <Unlock className="w-7 h-7 text-emerald-600 animate-in zoom-in-75 duration-200" />
            ) : (
              <Lock className="w-7 h-7" />
            )}
          </motion.div>

          {/* Title & Subtitle */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-1.5 text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isSuccess ? 'bg-emerald-500' : 'bg-primary-container'
                }`}
              />
              <span>Personal OS • Security Gate</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface tracking-tight">
              {isSuccess ? 'Access Granted' : 'Enter Master PIN'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {isSuccess
                ? 'Welcome back, Ferrel. Opening workspace...'
                : 'Unlock your workspace, finances, and pipeline sync.'}
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
                disabled={isSuccess}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full disabled:cursor-not-allowed"
                autoComplete="off"
              />

              {/* 4 Visual Digit Boxes with Shake & Success Animation */}
              <motion.div
                animate={
                  isShaking
                    ? { x: [-10, 10, -8, 8, -4, 4, 0] }
                    : isSuccess
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ duration: isShaking ? 0.35 : 0.3 }}
                className="flex items-center gap-3.5"
              >
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                        isSuccess
                          ? 'border-emerald-500 bg-emerald-500 text-white scale-105 shadow-sm'
                          : error
                          ? 'border-rose-400 bg-rose-50 text-rose-600'
                          : filled
                          ? 'border-primary-container bg-primary-fixed/30 text-on-surface scale-105 shadow-sm'
                          : 'border-outline/40 bg-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {isSuccess ? (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
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
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-rose-600 font-semibold"
              >
                Incorrect PIN. Please try again.
              </motion.p>
            )}

            <button
              type="submit"
              disabled={isSuccess}
              className={`w-full py-2.5 px-4 rounded-full text-xs font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                isSuccess
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-inverse-surface hover:bg-black text-white active:scale-95'
              }`}
            >
              {isSuccess ? (
                <>
                  <span>Workspace Unlocked</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Unlock Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Security badge footer */}
          <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-on-surface-variant">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
            <span>Device remember active for this session</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
