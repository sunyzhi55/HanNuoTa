import { describe, expect, it } from 'vitest'
import { DISK_THEMES, diskTheme, diskWidth } from './diskThemes'

describe('disk visuals', () => {
  it('provides a distinct palette for every supported disk up to 15', () => {
    const endColors = new Set(
      Array.from({ length: 15 }, (_, index) => diskTheme(index + 1).to),
    )

    expect(DISK_THEMES.length).toBeGreaterThanOrEqual(15)
    expect(endColors.size).toBe(15)
  })

  it('keeps widths ordered and inside the peg for high disk counts', () => {
    const widths = Array.from({ length: 15 }, (_, index) => diskWidth(index + 1, 15))

    expect(widths[0]).toBeGreaterThanOrEqual(40)
    expect(widths.at(-1)).toBeLessThanOrEqual(100)
    expect(widths.every((width, index) => index === 0 || width > widths[index - 1])).toBe(true)
  })
})
