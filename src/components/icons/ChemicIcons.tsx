import React from 'react';

export interface ChemicIconProps {
  className?: string;
  active?: boolean;
}

/**
 * Asymmetric bento grid mark for Dashboard Overview.
 */
export function CockpitMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="8"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <rect x="13" y="3" width="8" height="8" rx="2" fill="#FF6B00" />
      <rect x="13" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

/**
 * Stepped progression tiers mark for Career Pipeline.
 */
export function PipelineMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="12" width="5" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.9" />
      <rect
        x="9.5"
        y="8"
        width="5"
        height="13"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <rect x="16" y="3" width="5" height="18" rx="1.2" fill="#FF6B00" />
    </svg>
  );
}

/**
 * Chamfered focus aperture mark for Tasks & Deep Work.
 */
export function FocusMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 7.5L7.5 4H18.5C19.33 4 20 4.67 20 5.5V16.5L16.5 20H5.5C4.67 20 4 19.33 4 18.5V7.5Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <path
        d="M8.5 12.2L11 14.7L15.8 9.6"
        stroke="#FF6B00"
        strokeWidth="2.2"
        strokeLinecap="square"
      />
    </svg>
  );
}

/**
 * Stacked ledger cards with citrus clasp mark for Financial Vault.
 */
export function VaultMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 7.5V6C5 4.9 5.9 4 7 4H17C18.1 4 19 4.9 19 6V7.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="7.5"
        width="18"
        height="12.5"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <rect x="14.5" y="11.5" width="4" height="4.5" rx="1" fill="#FF6B00" />
    </svg>
  );
}

/**
 * Beveled developer console housing mark for Dev Control.
 */
export function ConsoleMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <path d="M7.5 9.5L10.5 12L7.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <rect x="12" y="13.5" width="5" height="2.2" rx="0.5" fill="#FF6B00" />
    </svg>
  );
}

/**
 * Cross-device staging tray mark for Dropzone Vault.
 */
export function RelayMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 14.5V18C4 19.1 4.9 20 6 20H18C19.1 20 20 19.1 20 18V14.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="square"
      />
      <rect x="12" y="4" width="6.5" height="6.5" rx="1.2" transform="rotate(45 12 4)" fill="#FF6B00" />
      <path
        d="M7 16.5H17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeOpacity={active ? 1 : 0.65}
      />
    </svg>
  );
}

/**
 * Asymmetric folio page with ribbon bookmark mark for Second Brain.
 */
export function LedgerNoteMark({ className = 'w-4 h-4', active = false }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 4H17.5C18.6 4 19.5 4.9 19.5 6V19.5H6.5C5.67 19.5 5 18.83 5 18V4Z"
        stroke="currentColor"
        strokeWidth="1.9"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.08 : 0}
      />
      <path d="M13.5 4V11L15.5 9.4L17.5 11V4H13.5Z" fill="#FF6B00" />
      <path d="M8.5 14.5H15.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
    </svg>
  );
}

/**
 * Proportional split allocation bar mark for Payday Budgeting.
 */
export function PaydayMark({ className = 'w-4 h-4' }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="4" width="18" height="5" rx="1.5" fill="currentColor" />
      <rect x="3" y="11" width="10.5" height="4" rx="1.2" fill="#FF6B00" />
      <rect x="15" y="11" width="6" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.8" />
      <rect x="3" y="17" width="6.5" height="3" rx="1" stroke="currentColor" strokeWidth="1.7" />
      <rect x="11" y="17" width="10" height="3" rx="1" fill="#027A48" />
    </svg>
  );
}

/**
 * Tactile quick-entry crosshair mark replacing generic Zap/Plus clichés.
 */
export function QuickCaptureMark({ className = 'w-4 h-4' }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="11" y="3.5" width="2" height="5.5" fill="currentColor" />
      <rect x="11" y="15" width="2" height="5.5" fill="currentColor" />
      <rect x="3.5" y="11" width="5.5" height="2" fill="currentColor" />
      <rect x="15" y="11" width="5.5" height="2" fill="currentColor" />
      <rect x="10" y="10" width="4" height="4" rx="1" fill="#FF6B00" />
    </svg>
  );
}

/**
 * Horizon slit mark for Daily Briefing.
 */
export function BriefingMark({ className = 'w-4 h-4' }: ChemicIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6.5 14.5C6.5 11.46 8.96 9 12 9C15.04 9 17.5 11.46 17.5 14.5H6.5Z" fill="#FF6B00" />
      <path d="M3 15.5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      <path d="M6 19H18" stroke="currentColor" strokeWidth="1.8" strokeOpacity="0.45" strokeLinecap="square" />
    </svg>
  );
}
