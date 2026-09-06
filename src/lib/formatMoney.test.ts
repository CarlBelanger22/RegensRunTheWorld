import { describe, expect, it } from 'vitest'
import { formatTransferFee } from './formatMoney'

describe('formatTransferFee', () => {
  it('inserts commas every three digits from the right', () => {
    expect(formatTransferFee(2_200_000)).toBe('€2,200,000')
    expect(formatTransferFee(8_500_000)).toBe('€8,500,000')
    expect(formatTransferFee(0)).toBe('€0')
    expect(formatTransferFee(999)).toBe('€999')
  })
})
