import {
  ArrowRight,
  Keyboard,
  Play,
  RotateCcw,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react'
import './App.css'
import { Board } from './components/Board'
import { SolutionPanel } from './components/SolutionPanel'
import {
  MAX_DISK_COUNT,
  MIN_DISK_COUNT,
  useHanoiGame,
} from './hooks/useHanoiGame'

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const DISK_OPTIONS = Array.from(
  { length: MAX_DISK_COUNT - MIN_DISK_COUNT + 1 },
  (_, index) => MIN_DISK_COUNT + index,
)

function App() {
  const game = useHanoiGame()
  const {
    canUndo,
    diskCount,
    elapsedMs,
    feedback,
    handlePegClick,
    invalidPeg,
    isDemoComplete,
    isPlaying,
    mode,
    moveCount,
    moveDurationMs,
    optimalMoves,
    pegs,
    resetGame,
    selectedPeg,
    setDiskCount,
    solved,
    soundEnabled,
    startDemo,
    toggleSound,
    undo,
  } = game

  const completionTitle =
    mode === 'demo'
      ? '最优解演示完成'
      : moveCount === optimalMoves
        ? '完美，正是最优解'
        : '塔已归位'

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-copy">
            <strong>汉诺塔</strong>
            <small>HANOI LAB</small>
          </span>
        </a>

        <div className="header-signal" aria-hidden="true">
          <span className="signal-line" />
          <span>RECURSIVE PLAYGROUND</span>
          <span className="signal-line" />
        </div>

        <div className="header-actions">
          <span className="session-status">
            <span className={`status-dot ${isPlaying ? 'is-playing' : ''}`} />
            {isPlaying ? '演示运行中' : solved ? '已完成' : '就绪'}
          </span>
          <button
            type="button"
            className="utility-button"
            onClick={toggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? '关闭音效' : '开启音效'}
            title={soundEnabled ? '关闭音效' : '开启音效'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span>{soundEnabled ? '音效' : '静音'}</span>
          </button>
        </div>
      </header>

      <main id="top">
        <section className="page-intro">
          <div className="intro-copy">
            <span className="eyebrow">CLASSIC PUZZLE · RECURSION</span>
            <h1>
              移动一座塔，
              <em>拆解一种思维。</em>
            </h1>
            <p>
              每次只能移动一个圆盘，大盘永远不能压在小盘上。把 A 柱的 {diskCount}{' '}
              个盘全部搬到 C 柱，看看你能不能踩中 {optimalMoves} 步的理论下限。
            </p>
          </div>

          <div className="mission-card">
            <span className="mono-label">YOUR MISSION</span>
            <div className="mission-route">
              <span>A</span>
              <span className="mission-line">
                <ArrowRight size={18} />
              </span>
              <span>C</span>
            </div>
            <p>
              {diskCount} 个盘 · 最少 <strong>{optimalMoves}</strong> 步
            </p>
            <button type="button" className="mission-play" onClick={startDemo}>
              <Play size={14} fill="currentColor" />
              观看最优解
            </button>
          </div>
        </section>

        <div className="workspace">
          <section className="game-column" aria-label="汉诺塔游戏">
            <div className="game-panel">
              <div className="game-panel-head">
                <div className="board-title">
                  <span className={`status-dot ${isPlaying ? 'is-playing' : ''}`} />
                  <div>
                    <span className="mono-label">
                      {mode === 'demo' ? 'DEMO CHANNEL' : 'LIVE BOARD'}
                    </span>
                    <strong>{diskCount} 盘挑战</strong>
                  </div>
                </div>

                <div className="game-stats">
                  <div className="game-stat">
                    <span>步数</span>
                    <strong>
                      {String(moveCount).padStart(2, '0')}
                      <small>/{optimalMoves}</small>
                    </strong>
                  </div>
                  <div className="game-stat">
                    <span>用时</span>
                    <strong className="stat-clock">{formatClock(elapsedMs)}</strong>
                  </div>
                  <div className="game-stat">
                    <span>每步</span>
                    <strong>{(moveDurationMs / 1000).toFixed(2)}s</strong>
                  </div>
                </div>
              </div>

              <div
                className={`board-status is-${feedback.kind}`}
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="feedback-pulse" aria-hidden="true" />
                <p key={feedback.id}>{feedback.text}</p>
                {selectedPeg && <span className="selection-flag">{selectedPeg} 柱已选中</span>}
              </div>

              <Board
                pegs={pegs}
                diskCount={diskCount}
                selectedPeg={selectedPeg}
                invalidPeg={invalidPeg}
                solved={solved}
                moveDurationMs={moveDurationMs}
                onPegClick={handlePegClick}
              />

              {solved && (
                <div className={`completion-strip ${mode === 'demo' ? 'is-demo' : ''}`}>
                  <span className="completion-icon">
                    <Trophy size={22} />
                  </span>
                  <div className="completion-copy">
                    <span className="mono-label">
                      {mode === 'demo' && isDemoComplete ? 'DEMO COMPLETE' : 'MISSION COMPLETE'}
                    </span>
                    <strong>{completionTitle}</strong>
                    <p>
                      {moveCount} 步 · 最优 {optimalMoves} 步
                      {mode === 'manual' && moveCount === optimalMoves
                        ? ' · 一步不多，一步不少'
                        : ''}
                    </p>
                  </div>
                  <button type="button" className="completion-action" onClick={resetGame}>
                    再来一局
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              <div className="game-controls">
                <div className="disk-selector">
                  <span className="control-label">
                    圆盘数量
                    <small>最多 {MAX_DISK_COUNT} 盘 · 切换重开</small>
                  </span>
                  <div className="segmented-control" role="group" aria-label="选择圆盘数量">
                    {DISK_OPTIONS.map((count) => (
                      <button
                        key={count}
                        type="button"
                        className={count === diskCount ? 'is-active' : ''}
                        onClick={() => setDiskCount(count)}
                        aria-pressed={count === diskCount}
                        aria-label={`${count} 个圆盘`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="game-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={undo}
                    disabled={!canUndo}
                  >
                    <Undo2 size={15} />
                    撤销
                  </button>
                  <button type="button" className="secondary-button" onClick={resetGame}>
                    <RotateCcw size={15} />
                    重开
                  </button>
                </div>
              </div>
            </div>

            <div className="play-guide">
              <div className="guide-item">
                <span className="guide-number">01</span>
                <div>
                  <strong>拿起</strong>
                  <p>点击有圆盘的柱子，选中顶部圆盘。</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-number">02</span>
                <div>
                  <strong>放下</strong>
                  <p>点击空柱或更大的顶盘，完成移动。</p>
                </div>
              </div>
              <div className="guide-item">
                <span className="guide-number">03</span>
                <div>
                  <strong>归位</strong>
                  <p>把全部圆盘按顺序搬到 C 柱即完成。</p>
                </div>
              </div>
              <div className="guide-tip">
                <Keyboard size={15} aria-hidden="true" />
                再次点击同一根柱子可取消选择；右侧速度滑杆会同时改变手动和自动演示的每步时长。
              </div>
            </div>
          </section>

          <div id="solution" className="solution-column">
            <SolutionPanel game={game} />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <p>
          最少步数不是猜出来的，而是由递归结构决定的。
          <span> T(n) = 2T(n−1) + 1 = 2ⁿ − 1</span>
        </p>
        <div className="footer-meta">
          <span>Vite</span>
          <span>React</span>
          <span>Motion</span>
        </div>
      </footer>
    </div>
  )
}

export default App
