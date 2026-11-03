'use client';

import React, { useState, useEffect } from 'react';
import { CareerPipeline, CareerCategory, CareerStage, WorkType } from '@/types/database';
import { X, CheckCircle2, Building2, Briefcase, FileText, Calendar, DollarSign, Globe, Video, User } from 'lucide-react';

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
    resume_version: 'CV-SE-v2.pdf',
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
        location: 'Jakarta (hybrid)',
        resume_version: 'CV-SE-v2.pdf',
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

  const steps: { stage: CareerStage; label: string }[] = [
    { stage: 'applied', label: 'Screening' },
    { stage: 'assessment', label: 'Assessment' },
    { stage: 'interview', label: 'Interview' },
    { stage: 'offer', label: 'Offering' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.stage === formData.stage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-surface-container-lowest rounded-3xl border border-outline/40 shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-outline/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-on-surface">
                {initialData ? 'Edit Application Details' : 'Record New Application'}
              </h3>
              <p className="text-xs text-on-surface-variant">
                Manage recruitment pipeline, CV versions, and follow-up timeline
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

        {/* Recruitment Pipeline Stepper */}
        <div className="px-6 py-3 bg-surface-container-low/60 border-b border-outline/20">
          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider block mb-2">
            Recruitment Pipeline Stages
          </span>
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const isPassed = currentStepIndex >= idx;
              const isCurrent = formData.stage === step.stage;

              return (
                <button
                  key={step.stage}
                  type="button"
                  onClick={() => setFormData({ ...formData, stage: step.stage })}
                  className="flex items-center gap-1.5 focus:outline-none group"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-primary-container text-white shadow-sm ring-2 ring-primary-container/30'
                        : isPassed
                        ? 'bg-inverse-surface text-white'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-xs transition-colors hidden sm:inline ${
                      isCurrent
                        ? 'font-bold text-on-surface'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Row 1: Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Company / Organization *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Tokopedia, Traveloka, BCA"
                  value={formData.entity_name}
                  onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Role / Position *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer Intern"
                value={formData.role_or_program}
                onChange={(e) => setFormData({ ...formData, role_or_program: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Row 2: Category & Work Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as CareerCategory })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              >
                <option value="internship">Internship</option>
                <option value="job">Full-time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Work Type
              </label>
              <select
                value={formData.work_type}
                onChange={(e) => setFormData({ ...formData, work_type: e.target.value as WorkType })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              >
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Source / Platform
              </label>
              <input
                type="text"
                placeholder="LinkedIn, Glints, Referral..."
                value={formData.platform_source}
                onChange={(e) => setFormData({ ...formData, platform_source: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Row 3: CV Version & Gaji / Saku */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Submitted Resume Version
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. CV-SE-v2.pdf, CV-Backend-Go.pdf"
                  value={formData.resume_version}
                  onChange={(e) => setFormData({ ...formData, resume_version: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Estimated Salary / Stipend
              </label>
              <input
                type="text"
                placeholder="e.g. Rp 4.500.000 / mo"
                value={formData.stipend_or_salary}
                onChange={(e) => setFormData({ ...formData, stipend_or_salary: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Row 4: Applied Date & Follow-Up Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Applied Date
              </label>
              <input
                type="date"
                value={formData.applied_date}
                onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Assessment Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Follow-up Schedule
              </label>
              <input
                type="date"
                value={formData.next_follow_up_date}
                onChange={(e) => setFormData({ ...formData, next_follow_up_date: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Row 5: Portal URL & Contact Person */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Job Listing / Meet Link
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.portal_url}
                onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">
                Recruiter / HR Contact
              </label>
              <input
                type="text"
                placeholder="HR name or email..."
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          {/* Row 6: Notes */}
          <div>
            <label className="block text-xs font-semibold text-on-surface mb-1">
              Notes &amp; Interview Preparation
            </label>
            <textarea
              rows={3}
              placeholder="Stack notes, take-home challenge progress, interview tips..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-surface-container-low border border-outline/30 rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none focus:border-primary-container resize-none"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline/20">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-outline/40 text-xs font-medium text-on-surface-variant hover:bg-surface-container-high transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-inverse-surface text-white text-xs font-semibold shadow-md hover:bg-black transition active:scale-95"
            >
              Save Application
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
