import { DropzoneItem } from '@/types/database';

export interface PurgeResult {
  retainedItems: DropzoneItem[];
  purgedCount: number;
}

export function purgeExpiredDropzoneItems(
  items: DropzoneItem[],
  nowMs = Date.now(),
  maxAgeMs = 24 * 60 * 60 * 1000
): PurgeResult {
  let purgedCount = 0;

  const retainedItems = items.filter((item) => {
    // Pinned items are never purged
    if (item.is_pinned) return true;

    if (!item.created_at) return true;
    const itemTime = new Date(item.created_at).getTime();
    if (isNaN(itemTime)) return true;

    const isExpired = nowMs - itemTime > maxAgeMs;
    if (isExpired) {
      purgedCount++;
      return false;
    }
    return true;
  });

  return { retainedItems, purgedCount };
}
