import { LayoutGroup, motion, useReducedMotion } from 'motion/react'
import { Flag } from 'lucide-react'
import type { CSSProperties } from 'react'
import { canMove, PEG_IDS, PEG_META, topDisk, type PegId, type Pegs } from '../lib/hanoi'
import { diskTheme, diskWidth } from '../lib/diskThemes'

interface BoardProps {
  pegs: Pegs
  diskCount: number
  selectedPeg: PegId | null
  invalidPeg: PegId | null
  solved: boolean
  moveDurationMs: number
  onPegClick: (peg: PegId) => void
}

const CONFETTI_COLORS = ['#6ee7b7', '#5eead4', '#93c5fd', '#c4b5fd', '#f0abfc', '#fcd34d', '#fda4af']
const CONFETTI = Array.from({ length: 30 }, (_, index) => ({
  left: `${(index * 37 + 11) % 100}%`,
  delay: `${(index % 10) * 0.055}s`,
  duration: `${2.1 + (index % 6) * 0.16}s`,
  color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
  width: `${4 + (index % 3) * 2}px`,
  height: `${8 + (index % 4) * 3}px`,
  rotate: `${(index * 47) % 180}deg`,
}))

export function Board({
  pegs,
  diskCount,
  selectedPeg,
  invalidPeg,
  solved,
  moveDurationMs,
  onPegClick,
}: BoardProps) {
  const reduceMotion = useReducedMotion()
  const diskGap = diskCount >= 12 ? 2 : diskCount >= 9 ? 3 : 4
  const diskHeight = Math.max(
    12,
    Math.min(34, (245 - (diskCount - 1) * diskGap) / diskCount),
  )
  const transitionDuration = reduceMotion ? 0 : Math.max(0.08, moveDurationMs / 1000)
  const boardStyle = {
    '--disk-height': `${diskHeight}px`,
    '--disk-gap': `${diskGap}px`,
  } as CSSProperties

  return (
    <div
      className={`board ${selectedPeg ? 'has-selection' : ''} ${diskCount >= 12 ? 'is-dense' : ''}`}
      style={boardStyle}
    >
      <div className="board-grid-glow" aria-hidden="true" />
      <div className="board-coordinates" aria-hidden="true">
        <span>TOWER ARRAY / 03</span>
        <span>RECURSIVE MOVE ENGINE</span>
      </div>

      {solved && (
        <div className="confetti-field" aria-hidden="true">
          {CONFETTI.map((piece, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                backgroundColor: piece.color,
                width: piece.width,
                height: piece.height,
                rotate: piece.rotate,
              }}
            />
          ))}
        </div>
      )}

      <LayoutGroup id="hanoi-board">
        <div className="pegs" role="group" aria-label="汉诺塔棋盘，共三根柱子">
          {PEG_IDS.map((peg) => {
            const disks = pegs[peg]
            const top = topDisk(pegs, peg)
            const meta = PEG_META[peg]
            const isSelected = selectedPeg === peg
            const canDrop = selectedPeg !== null && selectedPeg !== peg && canMove(pegs, selectedPeg, peg)
            const isBlocked =
              selectedPeg !== null && selectedPeg !== peg && !canMove(pegs, selectedPeg, peg)
            const isInvalid = invalidPeg === peg
            const pegClass = [
              'peg',
              isSelected ? 'is-selected' : '',
              canDrop ? 'is-candidate' : '',
              isBlocked ? 'is-blocked' : '',
              isInvalid ? 'is-invalid' : '',
              peg === 'C' ? 'is-target' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={peg}
                type="button"
                className={pegClass}
                onClick={() => onPegClick(peg)}
                aria-pressed={isSelected}
              >
                <span className="peg-heading">
                  <span className="peg-letter" style={{ color: meta.accent }}>
                    {peg}
                  </span>
                  <span className="peg-role">
                    <span>{meta.role}</span>
                    <span className="peg-count">{disks.length} 盘</span>
                  </span>
                  {peg === 'C' && <Flag className="peg-flag" size={14} aria-hidden="true" />}
                </span>

                <span className="peg-stage" aria-hidden="true">
                  <span className="peg-aura" aria-hidden="true" />
                  <span className="peg-rod" aria-hidden="true">
                    <span className="peg-rod-tip" />
                  </span>
                  <span className="peg-base" aria-hidden="true">
                    <span className="peg-base-highlight" />
                  </span>

                  <span className="disk-stack">
                    {disks.map((disk, index) => {
                      const theme = diskTheme(disk)
                      const isTop = index === disks.length - 1
                      const isPicked = isSelected && isTop
                      const diskStyle = {
                        width: `${diskWidth(disk, diskCount)}%`,
                        '--disk-from': theme.from,
                        '--disk-to': theme.to,
                        '--disk-glow': theme.glow,
                        '--disk-ink': theme.ink,
                      } as CSSProperties

                      return (
                        <motion.span
                          key={disk}
                          layoutId={`disk-${disk}`}
                          layout
                          className="disk-motion"
                          transition={{
                            layout: {
                              duration: transitionDuration,
                              ease: [0.22, 1, 0.36, 1],
                            },
                          }}
                        >
                          <span
                            className={`disk ${isTop ? 'is-top' : ''} ${isPicked ? 'is-picked' : ''}`}
                            style={diskStyle}
                            data-disk={disk}
                          >
                            <span className="disk-gloss" aria-hidden="true" />
                            <span className="disk-grain" aria-hidden="true" />
                            <span className="disk-label">{disk}</span>
                          </span>
                        </motion.span>
                      )
                    })}
                  </span>

                  {canDrop && <span className="drop-hint">可放下</span>}
                </span>

                <span className="peg-footer">
                  <span className={`peg-status ${top === undefined ? 'is-empty' : ''}`}>
                    {top === undefined ? '空柱' : `顶部 ${top}`}
                  </span>
                  {isSelected && <span className="peg-selected-label">已拿起</span>}
                </span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>

      <div className="board-floor" aria-hidden="true">
        <span />
        <span />
      </div>
    </div>
  )
}
