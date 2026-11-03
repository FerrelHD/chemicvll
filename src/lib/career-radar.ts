import { CareerPipeline } from '@/types/database';

export type RadarUrgency = 'normal' | 'follow_up_due' | 'assessment_urgent';

export interface RadarStatus {
  urgency: RadarUrgency;
  label: string;
  isUrgent: boolean;
}

export function getRadarStatus(item: CareerPipeline, refDate = new Date()): RadarStatus {
  // Check assessment deadline urgency (< 48 hours)
  if (item.stage === 'assessment' && item.deadline) {
    const deadlineMs = new Date(item.deadline).getTime();
    const diffHours = (deadlineMs - refDate.getTime()) / (1000 * 60 * 60);
    if (diffHours > 0 && diffHours <= 48) {
      return {
        urgency: 'assessment_urgent',
        label: `Deadline ${Math.round(diffHours)}j lagi!`,
        isUrgent: true,
      };
    }
  }

  // Check follow-up urgency for 'applied' stage (>= 5 days)
  if (item.stage === 'applied' && item.applied_date) {
    const appliedMs = new Date(item.applied_date).getTime();
    const diffDays = Math.floor((refDate.getTime() - appliedMs) / (1000 * 60 * 60 * 24));
    if (diffDays >= 5) {
      return {
        urgency: 'follow_up_due',
        label: `Waktunya Follow-up (${diffDays}h lalu)`,
        isUrgent: true,
      };
    }
  }

  return { urgency: 'normal', label: '', isUrgent: false };
}

export function generateFollowUpDraft(
  item: CareerPipeline,
  channel: 'email' | 'whatsapp' = 'email'
): string {
  const recruiter = item.contact_person || 'Tim Rekruter';
  const role = item.role_or_program;
  const company = item.entity_name;
  const appliedDate = item.applied_date
    ? new Date(item.applied_date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'beberapa hari lalu';

  if (channel === 'whatsapp') {
    return `Halo ${recruiter}, perkenalkan saya Ferrel yang melamar untuk posisi ${role} di ${company}. Izin menanyakan apakah ada update terkait tahapan seleksi berkas saya yang diajukan pada ${appliedDate}? Terima kasih banyak sebelumnya.`;
  }

  return `Subjek: Follow-up Lamaran - ${role} - Ferrel

Halo ${recruiter} ${company},

Saya Ferrel. Saya ingin menindaklanjuti berkas lamaran saya untuk posisi ${role} yang telah saya ajukan pada ${appliedDate}.

Saya sangat antusias dengan kesempatan ini dan siap apabila ada dokumen atau informasi teknis tambahan yang diperlukan.

Terima kasih atas waktu dan perhatiannya.

Salam,
Ferrel`;
}
