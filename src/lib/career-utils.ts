/**
 * Career & Internship utility functions (Ponytail style: minimal, zero dependencies)
 */

export function getDaysElapsed(appliedDate: string | null, referenceDate = new Date()): string {
  if (!appliedDate) return '';
  const applied = new Date(appliedDate);
  if (isNaN(applied.getTime())) return '';

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((referenceDate.getTime() - applied.getTime()) / msPerDay);

  if (diffDays < 0) return 'Upcoming';
  if (diffDays === 0) return 'Today';
  return `${diffDays}d ago`;
}

export function getFollowUpStatus(
  followUpDate: string | null,
  referenceDate = new Date()
): { isDue: boolean; label: string } | null {
  if (!followUpDate) return null;
  const target = new Date(followUpDate);
  if (isNaN(target.getTime())) return null;

  // Zero out time components for day comparison
  const refDay = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.round((targetDay.getTime() - refDay.getTime()) / msPerDay);

  if (diffDays < 0) {
    return { isDue: true, label: `Follow-up overdue (${Math.abs(diffDays)}d ago)` };
  }
  if (diffDays === 0) {
    return { isDue: true, label: 'Follow-up: Today' };
  }
  if (diffDays === 1) {
    return { isDue: true, label: 'Follow-up: Tomorrow' };
  }
  return { isDue: false, label: `Follow-up in ${diffDays}d` };
}

