import { motion } from 'motion/react'
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  MAX_MOVE_DURATION,
  MIN_MOVE_DURATION,
  type HanoiGame,
  type InteractionMode,
} from '../hooks/useHanoiGame'
import { formatMoveTime, type HanoiMove } from '../lib/hanoi'
import { diskTheme } from '../lib/diskThemes'

interface SolutionPanelProps {
  game: HanoiGame
}

const SPEED_PRESETS = [200, 400, 650, 1000, 1500]
const STEP_ROW_HEIGHT = 34
const STEP_LIST_HEIGHT = 282

interface StepListProps {
  solution: HanoiMove[]
  activeStepIndex: number | null
  demoIndex: number
  mode: InteractionMode
  isPlaying: boolean
  onJump: (step: number) => void
}

function StepList({
  solution,
  activeStepIndex,
  demoIndex,
  mode,
  isPlaying,
  onJump,
}: StepListProps) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const listHeight = Math.min(STEP_LIST_HEIGHT, solution.length * STEP_ROW_HEIGHT)
  const totalHeight = solution.length * STEP_ROW_HEIGHT
  const overscan = 6
  const startIndex = Math.max(0, Math.floor(scrollTop / STEP_ROW_HEIGHT) - overscan)
  const endIndex = Math.min(
    solution.length,
    Math.ceil((scrollTop + listHeight) / STEP_ROW_HEIGHT) + overscan,
  )
  const visibleMoves = solution.slice(startIndex, endIndex)

  useEffect(() => {
    if (activeStepIndex === null) return
    const list = listRef.current
    if (!list) return

    const rowTop = activeStepIndex * STEP_ROW_HEIGHT
    const rowBottom = rowTop + STEP_ROW_HEIGHT
    const viewTop = list.scrollTop
    const viewBottom = viewTop + list.clientHeight

    if (rowTop < viewTop) {
      list.scrollTo({ top: rowTop, behavior: isPlaying ? 'auto' : 'smooth' })
    } else if (rowBottom > viewBottom) {
      list.scrollTo({
        top: rowBottom - list.clientHeight,
        behavior: isPlaying ? 'auto' : 'smooth',
      })
    }
  }, [activeStepIndex, isPlaying])

  return (
    <div
      ref={listRef}
      className="steps-list"
      role="group"
      aria-label={`${solution.length} 步完整动作，可滚动浏览`}
      style={{ height: `${listHeight}px` }}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div className="steps-virtual-inner" style={{ height: `${totalHeight}px` }}>
        {visibleMoves.map((move) => {
          const isActive = mode === 'demo' && activeStepIndex === move.index
          const isDone = mode === 'demo' && move.index < demoIndex - 1
          const theme = diskTheme(move.disk)
          return (
            <button
              key={move.step}
              type="button"
              className={`step-row ${isActive ? 'is-active' : ''} ${isDone ? 'is-done' : ''}`}
              style={{ top: `${move.index * STEP_ROW_HEIGHT}px` }}
              onClick={() => onJump(move.step)}
              aria-current={isActive ? 'step' : undefined}
              title={move.reason}
            >
              <span className="sr-only">{`第 ${move.step} 步（${String(move.step).padStart(2, '0')}）：${move.disk} 号盘从 ${move.from} 搬到 ${move.to}。递归任务：${move.task.count} 盘子问题，起点 ${move.task.from}，辅助 ${move.task.via}，终点 ${move.task.to}。`}</span>
              <span className="step-number" aria-hidden="true">
                {String(move.step).padStart(2, '0')}
              </span>
              <span
                className="step-disk"
                aria-hidden="true"
                style={{
                  '--badge-from': theme.from,
                  '--badge-to': theme.to,
                  '--badge-ink': theme.ink,
                } as CSSProperties}
              >
                {move.disk}
              </span>
              <span className="step-route" aria-hidden="true">
                <b>{move.from}</b>
                <ArrowRight size={12} aria-hidden="true" />
                <b>{move.to}</b>
              </span>
              <span className="step-task" aria-hidden="true">
                {move.task.count} 盘子问题
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SolutionPanel({ game }: SolutionPanelProps) {
  const {
    activeStep,
    activeStepIndex,
    demoIndex,
    diskCount,
    isDemoComplete,
    isPlaying,
    jumpToStep,
    mode,
    moveDurationMs,
    nextStep,
    optimalMoves,
    prevStep,
    progress,
    setMoveDuration,
    solution,
    startDemo,
    togglePlayback,
  } = game

  const speedProgress =
    ((moveDurationMs - MIN_MOVE_DURATION) / (MAX_MOVE_DURATION - MIN_MOVE_DURATION)) * 100
  const activeTheme = activeStep ? diskTheme(activeStep.disk) : null
  const playLabel = isPlaying
    ? '暂停演示'
    : isDemoComplete
      ? '重新演示'
      : mode === 'demo' && demoIndex > 0
        ? '继续演示'
        : '播放最优解'

  return (
    <aside className="solution-panel" aria-label="参考答案与完整推演">
      <div className="solution-header">
        <div>
          <span className="eyebrow">
            <span className="live-dot" aria-hidden="true" />
            OPTIMAL PATH
          </span>
          <h2>参考解 · 递归推演</h2>
        </div>
        <span className="verified-pill">
          <Check size={12} strokeWidth={3} aria-hidden="true" />
          已验证
        </span>
      </div>

      <div className="solution-metrics">
        <div>
          <span>最优步数</span>
          <strong>{optimalMoves}</strong>
        </div>
        <div>
          <span>递归公式</span>
          <strong>
            2<sup>{diskCount}</sup>−1
          </strong>
        </div>
        <div>
          <span>演示进度</span>
          <strong>{mode === 'demo' ? `${Math.round(progress * 100)}%` : '—'}</strong>
        </div>
      </div>

      <div className={`panel-progress ${mode === 'demo' ? 'is-active' : ''}`} aria-hidden="true">
        <span style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <section className="speed-card" aria-labelledby="speed-heading">
        <div className="speed-heading">
          <span id="speed-heading">
            <Gauge size={15} aria-hidden="true" />
            每一步移动时间
          </span>
          <output htmlFor="move-speed">{formatMoveTime(moveDurationMs)}</output>
        </div>
        <input
          id="move-speed"
          className="speed-range"
          type="range"
          min={MIN_MOVE_DURATION}
          max={MAX_MOVE_DURATION}
          step={10}
          value={moveDurationMs}
          onChange={(event) => setMoveDuration(Number(event.target.value))}
          style={{ '--range-progress': `${speedProgress}%` } as CSSProperties}
          aria-label="设置每一步移动积木的时间"
          aria-valuetext={formatMoveTime(moveDurationMs)}
        />
        <div className="speed-scale" aria-hidden="true">
          <span>0.12 s · 快速</span>
          <span>2.00 s · 慢放</span>
        </div>
        <div className="speed-presets" role="group" aria-label="速度快捷选项">
          {SPEED_PRESETS.map((value) => (
            <button
              key={value}
              type="button"
              className={moveDurationMs === value ? 'is-active' : ''}
              onClick={() => setMoveDuration(value)}
            >
              {formatMoveTime(value)}
            </button>
          ))}
        </div>
      </section>

      <section className="transport" aria-label="演示控制">
        <button
          type="button"
          className="icon-button"
          onClick={() => jumpToStep(0)}
          disabled={mode === 'demo' && demoIndex === 0}
          aria-label="回到演示起点"
          title="回到起点"
        >
          <SkipBack size={16} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={prevStep}
          disabled={mode !== 'demo' || demoIndex <= 0}
          aria-label="上一步"
          title="上一步"
        >
          <ChevronLeft size={18} />
        </button>
        <button type="button" className="play-button" onClick={togglePlayback}>
          {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
          <span>{playLabel}</span>
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={nextStep}
          disabled={mode === 'demo' && demoIndex >= solution.length}
          aria-label="下一步"
          title="下一步"
        >
          <ChevronRight size={18} />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={startDemo}
          aria-label="从头播放演示"
          title="从头演示"
        >
          <RotateCcw size={15} />
        </button>
      </section>

      {mode === 'demo' && activeStep && activeTheme ? (
        <motion.section
          key={activeStep.step}
          className="active-step-card"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <div className="active-step-top">
            <span className="mono-label">
              STEP {String(activeStep.step).padStart(2, '0')} / {solution.length}
            </span>
            <span className="task-chip">
              {activeStep.task.count} 盘任务 · 深度 {activeStep.depth}
            </span>
          </div>

          <div className="active-move-row">
            <span
              className="move-disk-badge"
              style={{
                '--badge-from': activeTheme.from,
                '--badge-to': activeTheme.to,
                '--badge-glow': activeTheme.glow,
                '--badge-ink': activeTheme.ink,
              } as CSSProperties}
            >
              {activeStep.disk}
            </span>
            <div className="active-move-copy">
              <strong>
                将 {activeStep.disk} 号盘搬到 {activeStep.to} 柱
              </strong>
              <span className="active-route">
                <b>{activeStep.from}</b>
                <ArrowRight size={13} aria-hidden="true" />
                <b>{activeStep.to}</b>
              </span>
            </div>
          </div>

          <p className="active-reason">{activeStep.reason}</p>

          {activeStep.task.count > 1 ? (
            <div className="recursion-pipeline" aria-label="当前递归任务的三段结构">
              <div>
                <small>① 暂存小盘</small>
                <strong>{activeStep.task.count - 1} 盘</strong>
                <span>
                  {activeStep.task.from} → {activeStep.task.via}
                </span>
              </div>
              <div className="is-current">
                <small>② 落位最大盘</small>
                <strong>{activeStep.disk} 号盘</strong>
                <span>
                  {activeStep.from} → {activeStep.to}
                </span>
              </div>
              <div>
                <small>③ 小盘归位</small>
                <strong>{activeStep.task.count - 1} 盘</strong>
                <span>
                  {activeStep.task.via} → {activeStep.task.to}
                </span>
              </div>
            </div>
          ) : (
            <div className="base-case-note">
              <span>BASE CASE</span>
              只剩 1 个圆盘，直接移动就是唯一解。
            </div>
          )}
        </motion.section>
      ) : (
        <section className="manual-state">
          <span className="manual-state-icon">
            <Sparkles size={19} />
          </span>
          <div>
            <strong>先试着自己完成</strong>
            <p>
              当前是手动模式。点击「播放最优解」或下方任一步骤，即可查看每一步的完整演示与递归理由。
            </p>
          </div>
        </section>
      )}

      <section className="proof-card" aria-labelledby="proof-heading">
        <div className="proof-heading">
          <span id="proof-heading">
            <span className="proof-index">∀</span>
            为什么不可能更少？
          </span>
          <span className="mono-label">PROOF</span>
        </div>
        <ol className="proof-list">
          <li>
            最大的 {diskCount} 号盘必须至少移动一次。移动它之前，上方 {diskCount - 1}{' '}
            个盘必须全部让到 B 柱。
          </li>
          <li>
            它落到 C 柱后，这 {diskCount - 1} 个盘还必须全部从 B 柱搬到 C 柱。两个子问题各需{' '}
            T({diskCount - 1}) 步。
          </li>
          <li>递归构造恰好走完这些步，下界与上界重合。</li>
        </ol>
        <div className="formula">
          <span>T(n) = 2T(n−1) + 1</span>
          <strong>2ⁿ − 1</strong>
        </div>
        <p className="proof-result">
          当 n = {diskCount} 时，最少需要 <b>{optimalMoves}</b> 步。少一步都无法完成。
        </p>
      </section>

      <section className="steps-card" aria-labelledby="steps-heading">
        <div className="steps-heading">
          <div>
            <span className="eyebrow">FULL SEQUENCE</span>
            <h3 id="steps-heading">完整步骤</h3>
          </div>
          <span className="step-counter">
            {mode === 'demo' ? demoIndex : 0}/{solution.length}
          </span>
        </div>

        <StepList
          key={diskCount}
          solution={solution}
          activeStepIndex={activeStepIndex}
          demoIndex={demoIndex}
          mode={mode}
          isPlaying={isPlaying}
          onJump={jumpToStep}
        />

        <p className="steps-footnote">
          滚动浏览全部 {solution.length} 步，点击任一步骤可直接跳到该步之后的局面；速度滑杆同时控制自动演示与手动移动的动画时长。
        </p>
      </section>
    </aside>
  )
}
