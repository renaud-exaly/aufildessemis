import { describe, expect, it } from 'vitest'

import {
  formatSowingWindow,
  isInWindow,
  monthLabel,
} from '@/lib/months'

describe('months helper', () => {
  it('returns the french month label', () => {
    expect(monthLabel('05')).toBe('Mai')
    expect(monthLabel('12')).toBe('Décembre')
    expect(monthLabel('99')).toBe('99') // fallback when unknown
  })

  it('formats a sowing window', () => {
    expect(formatSowingWindow('03', '05')).toBe('Mars → Mai')
    expect(formatSowingWindow('06', '06')).toBe('Juin')
  })

  describe('isInWindow', () => {
    it('detects a month within an inclusive window', () => {
      expect(isInWindow('04', '03', '06')).toBe(true)
      expect(isInWindow('03', '03', '06')).toBe(true)
      expect(isInWindow('06', '03', '06')).toBe(true)
    })

    it('rejects a month outside the window', () => {
      expect(isInWindow('07', '03', '06')).toBe(false)
      expect(isInWindow('02', '03', '06')).toBe(false)
    })

    it('handles windows that wrap around year-end', () => {
      expect(isInWindow('12', '11', '02')).toBe(true)
      expect(isInWindow('01', '11', '02')).toBe(true)
      expect(isInWindow('05', '11', '02')).toBe(false)
    })
  })
})
