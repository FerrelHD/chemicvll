'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CareerPipeline } from '@/types/database';
import { useCareerStore } from '@/stores/useCareerStore';
import {
  X,
  MessageSquare,
  Mail,
  Linkedin,
  Copy,
  Check,
  ExternalLink,
  Send,
  CalendarCheck,
  Building2,
  Briefcase,
} from 'lucide-react';
import { motion } from 'framer-motion';

export type FollowUpChannel = 'whatsapp' | 'email' | 'linkedin';

interface CareerFollowUpModalProps {
  item: CareerPipeline | null;
  isOpen: boolean;
  onClose: () => void;
  onShowNotice?: (msg: string) => void;
}

export function CareerFollowUpModal({
  item,
  isOpen,
  onClose,
  onShowNotice,
}: CareerFollowUpModalProps) {
  const [mounted, setMounted] = useState(false);
  const updateItem = useCareerStore((s) => s.updateItem);
  const [channel, setChannel] = useState<FollowUpChannel>('whatsapp');
  const [recruiterName, setRecruiterName] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (item && isOpen) {
      const contact = item.contact_person || 'Tim Rekruter';
      setRecruiterName(contact);
      generateText(channel, item, contact);
    }
  }, [item, isOpen, channel]);

  if (!isOpen || !item || !mounted) return null;

  const generateText = (ch: FollowUpChannel, data: CareerPipeline, recruiter: string) => {
    const role = data.role_or_program;
    const company = data.entity_name;
    const appliedStr = data.applied_date
      ? new Date(data.applied_date).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'beberapa hari lalu';

    if (ch === 'whatsapp') {
      setMessageBody(
        `Halo Kak ${recruiter}, salam kenal saya Ferrel. Izin follow-up dengan sopan terkait lamaran saya untuk posisi ${role} di ${company} yang saya kirimkan pada ${appliedStr}.\n\nSaya sangat tertarik untuk dapat berkontribusi di ${company}. Apakah sudah ada pembaruan mengenai proses seleksi tahap selanjutnya?\n\nTerima kasih banyak atas waktu dan perhatiannya Kak! 🙏`
      );
    } else if (ch === 'email') {
      setMessageBody(
        `Subject: Follow-up Lamaran Pekerjaan - ${role} - Ferrel\n\nYth. Kak ${recruiter} / Tim Rekrutmen ${company},\n\nSemoga pesan ini menemui Anda dalam keadaan sehat.\n\nSaya ingin menanyakan kabar dan kelanjutan proses lamaran saya untuk posisi ${role} di ${company}, yang telah saya ajukan pada ${appliedStr}.\n\nSaya memiliki antusiasme yang tinggi untuk membawa keahlian teknis saya dan berkontribusi langsung bagi tim ${company}. Jika ada dokumen atau portofolio tambahan yang dibutuhkan, saya siap melengkapinya kapan saja.\n\nTerima kasih banyak atas waktu dan pertimbangannya.\n\nSalam hangat,\nFerrel\nPortfolio: chemicvll.vercel.app`
      );
    } else {
      // linkedin
      setMessageBody(
        `Halo Kak ${recruiter}, salam kenal! Saya Ferrel. Saya baru saja mendaftar untuk posisi ${role} di ${company} (${appliedStr}). Sangat antusias dengan visi tim ${company}! Boleh saya terhubung dengan Kakak di sini? Terima kasih banyak!`
      );
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(messageBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onShowNotice?.('Draft pesan berhasil disalin ke clipboard');
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(messageBody);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
    markAsFollowedUp();
  };

  const handleOpenMailto = () => {
    const lines = messageBody.split('\n');
    let subject = `Follow-up Lamaran: ${item.role_or_program} - Ferrel`;
    let body = messageBody;

    if (lines[0].startsWith('Subject: ')) {
      subject = lines[0].replace('Subject: ', '').trim();
      body = lines.slice(1).join('\n').trim();
    }

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    markAsFollowedUp();
  };

  const markAsFollowedUp = () => {
    // Postpone radar by setting next follow-up date 7 days from now
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 7);

    updateItem(item.id, {
      next_follow_up_date: nextDate.toISOString().split('T')[0],
      applied_date: new Date().toISOString(), // reset radar timer
    });

    onShowNotice?.(`Follow-up tercatat! Radar untuk ${item.entity_name} di-reset.`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="absolute inset-0 -z-10" onClick={onClose} />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 350 }}
        className="w-full sm:max-w-lg bg-surface-container-lowest border border-outline/40 shadow-2xl rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-fixed/60 flex items-center justify-center text-primary-container">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-on-surface">
                Follow-Up Generator
              </h3>
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-on-surface">{item.entity_name}</span>
                <span>•</span>
                <span className="truncate">{item.role_or_program}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Channel Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-container-low rounded-2xl mt-4 border border-outline/20">
          <button
            type="button"
            onClick={() => setChannel('whatsapp')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              channel === 'whatsapp'
                ? 'bg-surface-container-lowest text-emerald-600 shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('email')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              channel === 'email'
                ? 'bg-surface-container-lowest text-primary-container shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => setChannel('linkedin')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold transition-all ${
              channel === 'linkedin'
                ? 'bg-surface-container-lowest text-blue-600 shadow-sm border border-outline/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>
        </div>

        {/* Message Editor */}
        <div className="mt-4 flex-1 flex flex-col min-h-0 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1">
              Nama Rekruter / HR
            </label>
            <input
              type="text"
              value={recruiterName}
              onChange={(e) => {
                setRecruiterName(e.target.value);
                generateText(channel, item, e.target.value || 'Tim Rekruter');
              }}
              placeholder="cth. Kak Sarah, Pak Budi, Hiring Team..."
              className="w-full bg-surface-container-low border border-outline/40 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container transition"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-on-surface-variant">
                Draft Pesan (Bisa diedit langsung)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-semibold text-primary-container hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              className="w-full flex-1 bg-surface-container-low border border-outline/40 rounded-2xl p-3 text-xs text-on-surface leading-relaxed focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed/40 transition resize-none font-sans"
            />
          </div>

          {/* Action Triggers */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {channel === 'whatsapp' ? (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 text-xs active:scale-[0.99] transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Kirim via WA</span>
              </button>
            ) : channel === 'email' ? (
              <button
                type="button"
                onClick={handleOpenMailto}
                className="w-full bg-primary-container hover:bg-primary-container/90 text-white font-semibold py-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 text-xs active:scale-[0.99] transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Buka di Mail</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopy}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-2xl shadow-sm flex items-center justify-center gap-1.5 text-xs active:scale-[0.99] transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Salin untuk DM</span>
              </button>
            )}

            <button
              type="button"
              onClick={markAsFollowedUp}
              className="w-full bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold py-2.5 px-3 rounded-2xl border border-outline/30 flex items-center justify-center gap-1.5 text-xs active:scale-[0.99] transition-all"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-primary-container" />
              <span>Tandai Selesai</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
