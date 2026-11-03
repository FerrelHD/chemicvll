/**
 * Career & Internship utility functions (Ponytail style: minimal, zero dependencies)
 */

export function getDaysElapsed(appliedDate: string | null, referenceDate = new Date()): string {
  if (!appliedDate) return '';
  const applied = new Date(appliedDate);
  if (isNaN(applied.getTime())) return '';

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((referenceDate.getTime() - applied.getTime()) / msPerDay);

  if (diffDays < 0) return 'Mendatang';
  if (diffDays === 0) return 'Hari ini';
  return `${diffDays} hari lalu`;
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
    return { isDue: true, label: `Follow-up lewat (${Math.abs(diffDays)}d lalu)` };
  }
  if (diffDays === 0) {
    return { isDue: true, label: 'Follow-up: Hari ini' };
  }
  if (diffDays === 1) {
    return { isDue: true, label: 'Follow-up: Besok' };
  }
  return { isDue: false, label: `Follow-up: ${diffDays} hari lagi` };
}
