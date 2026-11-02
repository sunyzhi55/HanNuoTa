export interface DiskTheme {
  from: string
  to: string
  glow: string
  ink: string
}

/** One distinct palette entry per supported disk (up to 15). */
export const DISK_THEMES: DiskTheme[] = [
  { from: '#c4ffe8', to: '#5ee1ac', glow: 'rgba(94, 225, 172, 0.52)', ink: '#063b2b' },
  { from: '#b9f5ff', to: '#51d3e9', glow: 'rgba(81, 211, 233, 0.5)', ink: '#043743' },
  { from: '#c4d7ff', to: '#6e9ff5', glow: 'rgba(110, 159, 245, 0.5)', ink: '#071f4c' },
  { from: '#d7c9ff', to: '#9a83f2', glow: 'rgba(154, 131, 242, 0.5)', ink: '#24115b' },
  { from: '#ffc9e9', to: '#eb76ba', glow: 'rgba(235, 118, 186, 0.48)', ink: '#4b0b31' },
  { from: '#ffd0c0', to: '#f48267', glow: 'rgba(244, 130, 103, 0.48)', ink: '#4c160c' },
  { from: '#ffe8a8', to: '#f4c64e', glow: 'rgba(244, 198, 78, 0.46)', ink: '#473102' },
  { from: '#e2f9b0', to: '#a6df43', glow: 'rgba(166, 223, 67, 0.45)', ink: '#293a04' },
  { from: '#ffe0c2', to: '#f2a45e', glow: 'rgba(242, 164, 94, 0.48)', ink: '#4a2607' },
  { from: '#ffc9d2', to: '#ee7188', glow: 'rgba(238, 113, 136, 0.5)', ink: '#4b0e1a' },
  { from: '#f8c8ff', to: '#ce75e8', glow: 'rgba(206, 117, 232, 0.5)', ink: '#430d4b' },
  { from: '#d5d8ff', to: '#7d8bed', glow: 'rgba(125, 139, 237, 0.5)', ink: '#11164d' },
  { from: '#c1fff2', to: '#3dc9b1', glow: 'rgba(61, 201, 177, 0.5)', ink: '#043d32' },
  { from: '#f6e9c5', to: '#cfb36b', glow: 'rgba(207, 179, 107, 0.45)', ink: '#3d3009' },
  { from: '#e8d0ff', to: '#ad78df', glow: 'rgba(173, 120, 223, 0.5)', ink: '#2e0f4b' },
]

export function diskTheme(disk: number): DiskTheme {
  return DISK_THEMES[(Math.max(1, disk) - 1) % DISK_THEMES.length]
}

export function diskWidth(disk: number, count: number): number {
  if (count <= 1) return 96
  const smallest = 42
  const largest = 96
  return smallest + ((disk - 1) / (count - 1)) * (largest - smallest)
}
