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
        label: `Deadline in ${Math.round(diffHours)}h!`,
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
        label: `Follow-up Due (${diffDays}d ago)`,
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
  const recruiter = item.contact_person || 'Hiring Team';
  const role = item.role_or_program;
  const company = item.entity_name;
  const appliedDate = item.applied_date
    ? new Date(item.applied_date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'a few days ago';

  if (channel === 'whatsapp') {
    return `Hi ${recruiter}, I am writing to politely follow up on my application for the ${role} position at ${company}, submitted on ${appliedDate}. Looking forward to hearing any updates regarding the next steps. Thank you!`;
  }

  return `Subject: Following up on ${role} Application - Ferrel

Dear ${recruiter} at ${company},

I hope this email finds you well.

I am writing to follow up on my application for the ${role} position submitted on ${appliedDate}. I remain very enthusiastic about this opportunity and would welcome the chance to discuss how my background and skills could contribute to ${company}.

Please let me know if there are any additional materials or details needed from my end.

Thank you very much for your time and consideration.

Best regards,
Ferrel`;
}
