export const PEG_IDS = ['A', 'B', 'C'] as const

export type PegId = (typeof PEG_IDS)[number]

/** Disk arrays are ordered bottom -> top. Disk 1 is the smallest. */
export type Pegs = Record<PegId, number[]>

export interface PegMeta {
  name: string
  role: string
  accent: string
}

export const PEG_META: Record<PegId, PegMeta> = {
  A: { name: 'A 柱', role: '起点', accent: '#76f5c6' },
  B: { name: 'B 柱', role: '辅助', accent: '#8bb8ff' },
  C: { name: 'C 柱', role: '终点', accent: '#ffc876' },
}

export interface HanoiTask {
  count: number
  from: PegId
  to: PegId
  via: PegId
}

export interface HanoiMove {
  /** Zero-based position in the solution. */
  index: number
  /** One-based position, ready for the UI. */
  step: number
  disk: number
  from: PegId
  to: PegId
  depth: number
  task: HanoiTask
  reason: string
}

export interface MoveResult {
  pegs: Pegs
  moved: boolean
  disk?: number
  error?: string
}

export function createInitialPegs(count: number): Pegs {
  return {
    A: Array.from({ length: count }, (_, index) => count - index),
    B: [],
    C: [],
  }
}

export function topDisk(pegs: Pegs, peg: PegId): number | undefined {
  return pegs[peg].at(-1)
}

export function canMove(pegs: Pegs, from: PegId, to: PegId): boolean {
  if (from === to) return false
  const disk = topDisk(pegs, from)
  if (disk === undefined) return false
  const destination = topDisk(pegs, to)
  return destination === undefined || disk < destination
}

/**
 * Validates and applies one move without mutating the input.
 * A disk may only travel onto an empty peg or a larger disk.
 */
export function moveDisk(pegs: Pegs, from: PegId, to: PegId): MoveResult {
  if (from === to) {
    return { pegs, moved: false, error: '起点和落点相同。' }
  }

  const source = [...pegs[from]]
  const target = [...pegs[to]]
  const disk = source.at(-1)

  if (disk === undefined) {
    return { pegs, moved: false, error: `${PEG_META[from].name} 上没有可移动的盘。` }
  }

  const destination = target.at(-1)
  if (destination !== undefined && disk > destination) {
    return {
      pegs,
      moved: false,
      error: `${disk} 号盘比 ${destination} 号盘大，大盘不能压在小盘上。`,
    }
  }

  source.pop()
  target.push(disk)

  return {
    pegs: { ...pegs, [from]: source, [to]: target },
    moved: true,
    disk,
  }
}

export function isSolved(pegs: Pegs, count: number): boolean {
  return pegs.A.length === 0 && pegs.B.length === 0 && pegs.C.length === count
}

export function minimumMoves(count: number): number {
  return 2 ** count - 1
}

export function formatMoveTime(ms: number): string {
  return `${(ms / 1000).toFixed(ms % 1000 === 0 ? 1 : 2)} s`
}

function reasonFor(disk: number, from: PegId, to: PegId, task: HanoiTask): string {
  if (task.count === 1) {
    return `最小子问题：只剩 1 号盘，直接从 ${from} 搬到 ${to}，这一步没有别的选择。`
  }

  return `这是「${task.count} 盘 ${task.from} → ${task.to}」的核心一步：先把上方 ${task.count - 1} 只小盘暂存到 ${task.via}，${disk} 号盘才能从 ${from} 落到 ${to}；之后再把 ${task.count - 1} 只小盘从 ${task.via} 归位到 ${task.to}。`
}

/**
 * Builds the unique canonical optimal solution using the classic recursion:
 * move n-1 aside, move the largest disk, move n-1 back.
 */
export function buildSolution(count: number): HanoiMove[] {
  const rawMoves: Array<Omit<HanoiMove, 'index' | 'step' | 'reason'>> = []

  const solve = (
    size: number,
    from: PegId,
    to: PegId,
    via: PegId,
    depth: number,
  ): void => {
    if (size === 0) return

    solve(size - 1, from, via, to, depth + 1)
    rawMoves.push({
      disk: size,
      from,
      to,
      depth,
      task: { count: size, from, to, via },
    })
    solve(size - 1, via, to, from, depth + 1)
  }

  solve(count, 'A', 'C', 'B', 0)

  return rawMoves.map((move, index) => ({
    ...move,
    index,
    step: index + 1,
    reason: reasonFor(move.disk, move.from, move.to, move.task),
  }))
}

/** Replays the first `movesToApply` moves of the canonical solution. */
export function replaySolution(
  count: number,
  movesToApply: number,
  solution: HanoiMove[] = buildSolution(count),
): Pegs {
  const safeCount = Math.max(0, Math.min(movesToApply, solution.length))
  let pegs = createInitialPegs(count)

  for (let index = 0; index < safeCount; index += 1) {
    const move = solution[index]
    const result = moveDisk(pegs, move.from, move.to)
    if (!result.moved) {
      throw new Error(`Reference solution is invalid at step ${index + 1}: ${result.error}`)
    }
    pegs = result.pegs
  }

  return pegs
}
