import { describe, expect, it } from 'vitest'
import {
  buildSolution,
  canMove,
  createInitialPegs,
  isSolved,
  minimumMoves,
  moveDisk,
  replaySolution,
  topDisk,
} from './hanoi'

describe('hanoi rules', () => {
  it('stacks the initial disks largest to smallest from bottom to top', () => {
    const pegs = createInitialPegs(4)
    expect(pegs).toEqual({ A: [4, 3, 2, 1], B: [], C: [] })
    expect(topDisk(pegs, 'A')).toBe(1)
    expect(topDisk(pegs, 'B')).toBeUndefined()
  })

  it('moves a valid top disk onto an empty peg', () => {
    const pegs = createInitialPegs(3)
    const result = moveDisk(pegs, 'A', 'C')

    expect(result.moved).toBe(true)
    expect(result.disk).toBe(1)
    expect(result.pegs).toEqual({ A: [3, 2], B: [], C: [1] })
    expect(pegs).toEqual({ A: [3, 2, 1], B: [], C: [] })
  })

  it('rejects placing a larger disk onto a smaller one', () => {
    const pegs = { A: [3], B: [2, 1], C: [] } as const
    const result = moveDisk({ ...pegs, A: [...pegs.A], B: [...pegs.B], C: [] }, 'A', 'B')

    expect(result.moved).toBe(false)
    expect(result.pegs.B).toEqual([2, 1])
    expect(result.error).toContain('大盘不能压在小盘上')
  })

  it('rejects an empty source or an identical source and target', () => {
    const pegs = createInitialPegs(3)
    expect(moveDisk(pegs, 'B', 'C').moved).toBe(false)
    expect(moveDisk(pegs, 'A', 'A').moved).toBe(false)
    expect(canMove(pegs, 'B', 'C')).toBe(false)
    expect(canMove(pegs, 'A', 'C')).toBe(true)
  })

  it('recognises the solved state', () => {
    expect(isSolved({ A: [], B: [], C: [3, 2, 1] }, 3)).toBe(true)
    expect(isSolved({ A: [], B: [1], C: [3, 2] }, 3)).toBe(false)
    expect(isSolved(createInitialPegs(3), 3)).toBe(false)
  })
})

describe('canonical optimal solution', () => {
  it.each([1, 2, 3, 4, 5, 6, 7, 8, 15])(
    'solves %i disks in exactly 2^n - 1 legal moves',
    (count) => {
      const solution = buildSolution(count)
      let pegs = createInitialPegs(count)

      expect(solution).toHaveLength(minimumMoves(count))
      expect(solution[0]).toMatchObject({ step: 1, index: 0, disk: 1, from: 'A' })
      expect(solution.at(-1)?.step).toBe(minimumMoves(count))

      for (const move of solution) {
        expect(canMove(pegs, move.from, move.to)).toBe(true)
        const result = moveDisk(pegs, move.from, move.to)
        expect(result.moved).toBe(true)
        expect(result.disk).toBe(move.disk)
        pegs = result.pegs
      }

      expect(isSolved(pegs, count)).toBe(true)
    },
  )

  it('replays any prefix to the identical board state', () => {
    for (let movesToApply = 0; movesToApply <= 15; movesToApply += 1) {
      const solution = buildSolution(4)
      let expected = createInitialPegs(4)

      for (const move of solution.slice(0, movesToApply)) {
        expected = moveDisk(expected, move.from, move.to).pegs
      }

      expect(replaySolution(4, movesToApply)).toEqual(expected)
    }
  })

  it('includes a concrete recursive reason for every step', () => {
    const solution = buildSolution(4)
    const rootMove = solution[2 ** 3 - 1]

    expect(solution.every((move) => move.reason.length > 20)).toBe(true)
    expect(rootMove).toMatchObject({
      disk: 4,
      from: 'A',
      to: 'C',
      task: { count: 4, from: 'A', to: 'C', via: 'B' },
    })
    expect(solution.some((move) => move.reason.includes('最小子问题'))).toBe(true)
    expect(solution.some((move) => move.reason.includes('核心一步'))).toBe(true)
  })

  it('clamps replay counts to the available solution', () => {
    expect(replaySolution(3, -1)).toEqual(createInitialPegs(3))
    expect(replaySolution(3, 99)).toEqual({ A: [], B: [], C: [3, 2, 1] })
  })
})
