import { useEffect, useMemo, useRef, useState } from 'react'
import {
  buildSolution,
  createInitialPegs,
  formatMoveTime,
  isSolved,
  minimumMoves,
  moveDisk,
  replaySolution,
  topDisk,
  type PegId,
  type Pegs,
} from '../lib/hanoi'
import { playTone } from '../lib/audio'

export const MIN_DISK_COUNT = 3
export const MAX_DISK_COUNT = 15
export const MIN_MOVE_DURATION = 120
export const MAX_MOVE_DURATION = 2000
export const DEFAULT_MOVE_DURATION = 650
const DEFAULT_DISK_COUNT = 4

export type InteractionMode = 'manual' | 'demo'
export type FeedbackKind = 'info' | 'success' | 'error'

export interface Feedback {
  id: number
  kind: FeedbackKind
  text: string
}

export interface MoveLogEntry {
  id: number
  step: number
  disk: number
  from: PegId
  to: PegId
  source: 'manual' | 'demo'
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function initialSoundPreference(): boolean {
  try {
    return window.localStorage.getItem('hanoi-lab:sound') !== 'off'
  } catch {
    return true
  }
}

export function useHanoiGame() {
  const [diskCount, setDiskCountState] = useState(DEFAULT_DISK_COUNT)
  const [pegs, setPegs] = useState<Pegs>(() => createInitialPegs(DEFAULT_DISK_COUNT))
  const [moveLog, setMoveLog] = useState<MoveLogEntry[]>([])
  const [selectedPeg, setSelectedPeg] = useState<PegId | null>(null)
  const [mode, setMode] = useState<InteractionMode>('manual')
  const [demoIndex, setDemoIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [moveDurationMs, setMoveDurationState] = useState(DEFAULT_MOVE_DURATION)
  const [soundEnabled, setSoundEnabled] = useState(initialSoundPreference)
  const [feedback, setFeedback] = useState<Feedback>({
    id: 0,
    kind: 'info',
    text: '点击 A 柱，拿起最上面的 1 号盘。',
  })
  const [invalidPeg, setInvalidPeg] = useState<PegId | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsedMs, setElapsedMs] = useState(0)

  const nextLogId = useRef(1)
  const nextFeedbackId = useRef(1)
  const invalidTimer = useRef<number | null>(null)

  const solution = useMemo(() => buildSolution(diskCount), [diskCount])
  const optimalMoves = useMemo(() => minimumMoves(diskCount), [diskCount])
  const solved = useMemo(() => isSolved(pegs, diskCount), [diskCount, pegs])
  const isDemoComplete = mode === 'demo' && demoIndex >= solution.length
  const progress = mode === 'demo' ? demoIndex / solution.length : 0
  const moveCount = mode === 'demo' ? demoIndex : moveLog.length

  const activeStepIndex =
    mode === 'demo'
      ? demoIndex === 0
        ? 0
        : Math.min(demoIndex - 1, solution.length - 1)
      : null
  const activeStep = activeStepIndex === null ? null : solution[activeStepIndex]

  useEffect(() => {
    if (startedAt === null || solved) return

    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt)
    }, 100)

    return () => window.clearInterval(timer)
  }, [solved, startedAt])

  useEffect(() => {
    if (!isPlaying || mode !== 'demo' || demoIndex >= solution.length) return

    const timer = window.setTimeout(() => {
      const step = solution[demoIndex]
      const result = moveDisk(pegs, step.from, step.to)

      if (!result.moved) {
        setIsPlaying(false)
        setFeedback({
          id: nextFeedbackId.current++,
          kind: 'error',
          text: `演示中断：${result.error}`,
        })
        return
      }

      setPegs(result.pegs)
      setDemoIndex((current) => current + 1)

      if (soundEnabled) playTone(step.disk, 'demo')

      if (demoIndex + 1 >= solution.length) {
        setIsPlaying(false)
        setFeedback({
          id: nextFeedbackId.current++,
          kind: 'success',
          text: `演示完成：${solution.length} 步，正好是最优解。`,
        })
        if (soundEnabled) playTone(step.disk, 'win')
      }
    }, moveDurationMs)

    return () => window.clearTimeout(timer)
  }, [demoIndex, isPlaying, mode, moveDurationMs, pegs, solution, soundEnabled])

  useEffect(() => {
    return () => {
      if (invalidTimer.current !== null) {
        window.clearTimeout(invalidTimer.current)
      }
    }
  }, [])

  function showFeedback(text: string, kind: FeedbackKind = 'info'): void {
    setFeedback({ id: nextFeedbackId.current++, kind, text })
  }

  function flashInvalid(peg: PegId): void {
    setInvalidPeg(peg)
    if (invalidTimer.current !== null) window.clearTimeout(invalidTimer.current)
    invalidTimer.current = window.setTimeout(() => setInvalidPeg(null), 460)
  }

  function resetCore(count: number, nextMode: InteractionMode = 'manual'): void {
    setPegs(createInitialPegs(count))
    setMoveLog([])
    setSelectedPeg(null)
    setMode(nextMode)
    setDemoIndex(0)
    setIsPlaying(false)
    setStartedAt(null)
    setElapsedMs(0)
    setInvalidPeg(null)
  }

  function handlePegClick(peg: PegId): void {
    if (solved) {
      showFeedback('这一局已经完成。重开一局，或者回看右侧的完整推演。', 'success')
      return
    }

    if (isPlaying) setIsPlaying(false)

    const switchingFromDemo = mode === 'demo'
    const baseMoveCount = switchingFromDemo ? demoIndex : moveLog.length

    if (switchingFromDemo) {
      setMode('manual')
      setDemoIndex(0)
      setMoveLog(
        solution.slice(0, demoIndex).map((move) => ({
          id: nextLogId.current++,
          step: move.step,
          disk: move.disk,
          from: move.from,
          to: move.to,
          source: 'demo' as const,
        })),
      )
    }

    if (selectedPeg === peg) {
      setSelectedPeg(null)
      showFeedback('已放回原处，重新选择要移动的圆盘。')
      return
    }

    if (selectedPeg === null) {
      const disk = topDisk(pegs, peg)
      if (disk === undefined) {
        flashInvalid(peg)
        if (soundEnabled) playTone(0, 'error')
        showFeedback(`${peg} 柱是空的，先选择一根有圆盘的柱子。`, 'error')
        return
      }

      setSelectedPeg(peg)
      if (soundEnabled) playTone(disk, 'select')
      showFeedback(`已拿起 ${disk} 号盘。现在点击一根目标柱放下它。`)
      return
    }

    const result = moveDisk(pegs, selectedPeg, peg)
    if (!result.moved) {
      flashInvalid(peg)
      if (soundEnabled) playTone(result.disk ?? 0, 'error')
      showFeedback(result.error ?? '这一步不合法。', 'error')
      return
    }

    const nextLogEntry: MoveLogEntry = {
      id: nextLogId.current++,
      step: baseMoveCount + 1,
      disk: result.disk ?? 0,
      from: selectedPeg,
      to: peg,
      source: 'manual',
    }

    setPegs(result.pegs)
    setMoveLog((current) => [...current, nextLogEntry])
    setSelectedPeg(null)
    setStartedAt((current) => current ?? Date.now())
    if (soundEnabled) {
      playTone(result.disk ?? 1, isSolved(result.pegs, diskCount) ? 'win' : 'move')
    }

    if (isSolved(result.pegs, diskCount)) {
      setIsPlaying(false)
      if (startedAt !== null) {
        setElapsedMs(Date.now() - startedAt)
      }
      showFeedback(
        `塔已归位！${baseMoveCount + 1} 步完成，最优解是 ${optimalMoves} 步。`,
        'success',
      )
    } else {
      showFeedback(
        `已移动 ${result.disk} 号盘：${selectedPeg} → ${peg}。继续保持小盘在上。`,
        'success',
      )
    }
  }

  function setDiskCount(count: number): void {
    const safeCount = clamp(Math.round(count), MIN_DISK_COUNT, MAX_DISK_COUNT)
    if (safeCount === diskCount) return

    setDiskCountState(safeCount)
    resetCore(safeCount)
    showFeedback(`已换成 ${safeCount} 盘挑战，最少需要 ${minimumMoves(safeCount)} 步。`)
  }

  function setMoveDuration(value: number): void {
    setMoveDurationState(clamp(Math.round(value), MIN_MOVE_DURATION, MAX_MOVE_DURATION))
  }

  function toggleSound(): void {
    setSoundEnabled((current) => {
      const next = !current
      if (next) playTone(1, 'select')
      try {
        window.localStorage.setItem('hanoi-lab:sound', next ? 'on' : 'off')
      } catch {
        // Storage may be unavailable; the toggle still works for this session.
      }
      return next
    })
  }

  function resetGame(): void {
    resetCore(diskCount)
    showFeedback(`已重开 ${diskCount} 盘挑战，目标是让所有圆盘落在 C 柱。`)
  }

  function undo(): void {
    if (mode !== 'manual' || moveLog.length === 0) return

    setIsPlaying(false)
    let nextPegs = createInitialPegs(diskCount)
    for (const entry of moveLog.slice(0, -1)) {
      const result = moveDisk(nextPegs, entry.from, entry.to)
      if (!result.moved) break
      nextPegs = result.pegs
    }

    setPegs(nextPegs)
    setMoveLog((current) => current.slice(0, -1))
    setSelectedPeg(null)
    setMode('manual')
    setDemoIndex(0)
    showFeedback('已撤销上一步。')
  }

  function jumpToStep(target: number): void {
    const safeTarget = clamp(target, 0, solution.length)
    setPegs(replaySolution(diskCount, safeTarget, solution))
    setMode('demo')
    setDemoIndex(safeTarget)
    setIsPlaying(false)
    setSelectedPeg(null)
    setStartedAt(null)
    setElapsedMs(0)
    setMoveLog([])

    if (safeTarget === 0) {
      showFeedback('已回到演示起点。点击播放，或单步向前。')
    } else if (safeTarget === solution.length) {
      showFeedback(`演示完成：${solution.length} 步，正好是最优解。`, 'success')
      if (soundEnabled) playTone(1, 'win')
    } else {
      showFeedback(`已定位到第 ${safeTarget} 步之后的局面。`)
    }
  }

  function startDemo(): void {
    resetCore(diskCount, 'demo')
    setIsPlaying(true)
    showFeedback(
      `开始最优解演示：${solution.length} 步，每一步 ${formatMoveTime(moveDurationMs)}。`,
    )
  }

  function togglePlayback(): void {
    if (isPlaying) {
      setIsPlaying(false)
      showFeedback('演示已暂停，可单步前进或拖动时间轴。')
      return
    }

    if (mode === 'demo' && demoIndex < solution.length) {
      setIsPlaying(true)
      showFeedback('继续演示最优解。')
      return
    }

    startDemo()
  }

  function nextStep(): void {
    if (mode !== 'demo') {
      jumpToStep(1)
      return
    }
    if (demoIndex >= solution.length) return
    jumpToStep(demoIndex + 1)
  }

  function prevStep(): void {
    if (mode !== 'demo' || demoIndex <= 0) return
    jumpToStep(demoIndex - 1)
  }

  return {
    diskCount,
    pegs,
    selectedPeg,
    mode,
    moveLog,
    moveCount,
    solution,
    optimalMoves,
    solved,
    activeStep,
    activeStepIndex,
    demoIndex,
    isPlaying,
    isDemoComplete,
    progress,
    moveDurationMs,
    soundEnabled,
    feedback,
    invalidPeg,
    elapsedMs,
    canUndo: mode === 'manual' && moveLog.length > 0,
    setDiskCount,
    setMoveDuration,
    toggleSound,
    handlePegClick,
    resetGame,
    undo,
    startDemo,
    togglePlayback,
    nextStep,
    prevStep,
    jumpToStep,
  }
}

export type HanoiGame = ReturnType<typeof useHanoiGame>
