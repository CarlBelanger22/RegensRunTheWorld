/** Format a euro amount with thousands separators, e.g. 2200000 → "€2,200,000". */
export function formatTransferFee(amount: number): string {
  if (!Number.isFinite(amount)) return '€—'
  return `€${Math.round(amount).toLocaleString('en-US')}`
}
