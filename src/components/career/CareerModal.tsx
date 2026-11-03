'use client';

import React, { useState, useEffect } from 'react';
import { CareerPipeline, CareerCategory, CareerStage, WorkType } from '@/types/database';
import { X } from 'lucide-react';

interface CareerModalProps {
  isOpen: boolean;
  initialData?: CareerPipeline | null;
  onClose: () => void;
  onSave: (data: Omit<CareerPipeline, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function CareerModal({ isOpen, initialData, onClose, onSave }: CareerModalProps) {
  const [formData, setFormData] = useState({
    entity_name: '',
    role_or_program: '',
    category: 'internship' as CareerCategory,
    stage: 'applied' as CareerStage,
    applied_date: new Date().toISOString().split('T')[0],
    deadline: '',
    platform_source: 'LinkedIn',
    work_type: 'hybrid' as WorkType,
    location: '',
    resume_version: '',
    stipend_or_salary: '',
    contact_person: '',
    next_follow_up_date: '',
    portal_url: '',
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        entity_name: initialData.entity_name || '',
        role_or_program: initialData.role_or_program || '',
        category: initialData.category || 'internship',
        stage: initialData.stage || 'applied',
        applied_date: initialData.applied_date ? initialData.applied_date.split('T')[0] : '',
        deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
        platform_source: initialData.platform_source || '',
        work_type: initialData.work_type || 'hybrid',
        location: initialData.location || '',
        resume_version: initialData.resume_version || '',
        stipend_or_salary: initialData.stipend_or_salary || '',
        contact_person: initialData.contact_person || '',
        next_follow_up_date: initialData.next_follow_up_date || '',
        portal_url: initialData.portal_url || '',
        notes: initialData.notes || '',
      });
    } else {
      setFormData({
        entity_name: '',
        role_or_program: '',
        category: 'internship',
        stage: 'applied',
        applied_date: new Date().toISOString().split('T')[0],
        deadline: '',
        platform_source: 'LinkedIn',
        work_type: 'hybrid',
        location: '',
        resume_version: '',
        stipend_or_salary: '',
        contact_person: '',
        next_follow_up_date: '',
        portal_url: '',
        notes: '',
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.entity_name.trim() || !formData.role_or_program.trim()) return;

    onSave({
      ...formData,
      applied_date: formData.applied_date ? `${formData.applied_date}T00:00:00Z` : null,
      deadline: formData.deadline ? `${formData.deadline}T00:00:00Z` : null,
      next_follow_up_date: formData.next_follow_up_date || null,
      platform_source: formData.platform_source || null,
      location: formData.location || null,
      resume_version: formData.resume_version || null,
      stipend_or_salary: formData.stipend_or_salary || null,
      contact_person: formData.contact_person || null,
      portal_url: formData.portal_url || null,
      notes: formData.notes || null,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-xl border border-appleBorder shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-semibold text-appleText-primary">
              {initialData ? 'Edit Lamaran' : 'Catat Lamaran Baru'}
            </h3>
            <p className="text-xs text-appleText-secondary mt-0.5">
              Kelola riwayat lamaran magang atau pekerjaan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-appleText-muted hover:text-appleText-primary hover:bg-subtle transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Row 1: Entity Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Perusahaan / Organisasi *
              </label>
              <input
                type="text"
                required
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                placeholder="Misal: Tokopedia"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Posisi / Role *
              </label>
              <input
                type="text"
                required
                value={formData.role_or_program}
                onChange={(e) => setFormData({ ...formData, role_or_program: e.target.value })}
                placeholder="Misal: Software Engineer Intern"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
          </div>

          {/* Row 2: Category & Stage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Kategori
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CareerCategory })}
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="internship">Magang (Internship)</option>
                <option value="job">Pekerjaan (Full-time / Part-time)</option>
                <option value="freelance">Freelance</option>
                <option value="scholarship">Beasiswa</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Tahap Saat Ini
              </label>
              <select
                value={formData.stage}
                onChange={(e) => setFormData({ ...formData, stage: e.target.value as CareerStage })}
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="wishlist">Wishlist (Rencana)</option>
                <option value="applied">Applied (Sudah Submit)</option>
                <option value="assessment">Assessment (Tes Teknis/Online)</option>
                <option value="interview">Interview</option>
                <option value="offer">Offer (Diterima)</option>
                <option value="rejected">Rejected (Ditolak)</option>
              </select>
            </div>
          </div>

          {/* Row 3: Applied Date & Next Follow-up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Tanggal Submit Lamaran
              </label>
              <input
                type="date"
                value={formData.applied_date}
                onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Pengingat Follow-up
              </label>
              <input
                type="date"
                value={formData.next_follow_up_date}
                onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 4: Platform Source & Resume Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Sumber / Platform
              </label>
              <input
                type="text"
                value={formData.platform_source}
                onChange={(e) => setFormData({ ...formData, platform_source: e.target.value })}
                placeholder="LinkedIn, Glints, Website Karir, dll"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Versi CV yang Dikirim
              </label>
              <input
                type="text"
                value={formData.resume_version}
                onChange={(e) => setFormData({ ...formData, resume_version: e.target.value })}
                placeholder="Misal: CV-SE-v2.pdf"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono text-xs"
              />
            </div>
          </div>

          {/* Row 5: Work Type, Location, & Stipend */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Tipe Kerja
              </label>
              <select
                value={formData.work_type}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value as WorkType })}
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Lokasi
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Jakarta / Remote"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Uang Saku / Gaji
              </label>
              <input
                type="text"
                value={formData.stipend_or_salary}
                onChange={(e) => setFormData({ ...formData, stipend_or_salary: e.target.value })}
                placeholder="Misal: Rp 4.5jt / bln"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
          </div>

          {/* Row 6: Portal URL & Recruiter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Link Lowongan / Portal
              </label>
              <input
                type="url"
                value={formData.portal_url}
                onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-medium text-appleText-secondary mb-1">
                Kontak HR / Recruiter
              </label>
              <input
                type="text"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                placeholder="Nama / Email / LinkedIn"
                className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
              />
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="block font-medium text-appleText-secondary mb-1">
              Catatan / Info Penting
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan cover letter, jadwal tes, tips interview, dll"
              className="w-full px-3 py-2 rounded-lg border border-appleBorder bg-subtle text-appleText-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
            ></textarea>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-appleText-secondary hover:text-appleText-primary hover:bg-subtle transition font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-900 text-white font-medium hover:bg-black transition shadow-sm"
            >
              {initialData ? 'Simpan Perubahan' : 'Catat Lamaran'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

