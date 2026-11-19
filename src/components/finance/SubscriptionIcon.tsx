'use client';

import React, { useState } from 'react';
import { getSubscriptionIconUrl } from '@/lib/subscription-icons';

interface SubscriptionIconProps {
  name: string;
  size?: 'sm' | 'md';
}

export function SubscriptionIcon({ name, size = 'md' }: SubscriptionIconProps) {
  const iconUrl = getSubscriptionIconUrl(name, 64);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(iconUrl && failedUrl !== iconUrl);

  const boxClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 sm:w-9 sm:h-9 text-xs';
  const imgClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const initial = name.trim()[0]?.toUpperCase() || '?';

  if (showImage && iconUrl) {
    return (
      <div
        className={`${boxClass} rounded-full bg-white border border-outline/30 flex items-center justify-center shrink-0 overflow-hidden shadow-xs`}
      >
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(iconUrl)}
          className={`${imgClass} object-contain rounded-sm`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${boxClass} rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface shrink-0 uppercase`}
    >
      {initial}
    </div>
  );
}
