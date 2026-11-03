/**
 * Privacy utility to mask sensitive financial amounts and information.
 */
export function formatMaskedCurrency(amount: number, isPrivacyMode: boolean): string {
  if (isPrivacyMode) {
    return 'Rp •••••••';
  }
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

