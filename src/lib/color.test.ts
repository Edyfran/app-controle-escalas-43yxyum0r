import { describe, it, expect } from 'vitest'
import { hexToHslTriplet, hslTripletToHex, contrastingForeground } from './color'

function hexToRgb(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

describe('hexToHslTriplet / hslTripletToHex', () => {
  it('round-trips a known color within rounding tolerance (indigo-ish default)', () => {
    const hex = '#6366f1'
    const triplet = hexToHslTriplet(hex)
    const roundTripped = hslTripletToHex(triplet)
    const [r1, g1, b1] = hexToRgb(hex)
    const [r2, g2, b2] = hexToRgb(roundTripped)
    // HSL round-tripping rounds to integer degrees/percentages, so allow a couple of
    // channel-value's worth of drift instead of requiring byte-for-byte equality.
    expect(Math.abs(r1 - r2)).toBeLessThanOrEqual(2)
    expect(Math.abs(g1 - g2)).toBeLessThanOrEqual(2)
    expect(Math.abs(b1 - b2)).toBeLessThanOrEqual(2)
  })

  it('converts pure red correctly', () => {
    expect(hexToHslTriplet('#ff0000')).toBe('0 100% 50%')
  })

  it('converts white and black without dividing by zero', () => {
    expect(hexToHslTriplet('#ffffff')).toBe('0 0% 100%')
    expect(hexToHslTriplet('#000000')).toBe('0 0% 0%')
  })
})

describe('contrastingForeground', () => {
  it('picks a dark foreground for a light background', () => {
    expect(contrastingForeground('45 90% 90%')).toBe('222 47% 11%')
  })

  it('picks a light foreground for a dark/saturated background', () => {
    expect(contrastingForeground('234 89% 40%')).toBe('210 40% 98%')
  })
})
