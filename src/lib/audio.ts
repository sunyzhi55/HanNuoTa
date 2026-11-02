type ToneKind = 'select' | 'move' | 'demo' | 'error' | 'win'

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioContextConstructor = window.AudioContext
  if (!AudioContextConstructor) return null

  audioContext ??= new AudioContextConstructor()
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return audioContext
}

function scheduleTone(
  context: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType,
): void {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(start)
  oscillator.stop(start + duration + 0.02)
}

/** Small, dependency-free sound design. Audio failures never affect gameplay. */
export function playTone(disk: number, kind: ToneKind): void {
  try {
    const context = getContext()
    if (!context) return

    const now = context.currentTime + 0.005

    if (kind === 'error') {
      scheduleTone(context, 118, now, 0.16, 0.045, 'triangle')
      scheduleTone(context, 92, now + 0.06, 0.14, 0.035, 'triangle')
      return
    }

    if (kind === 'win') {
      scheduleTone(context, 392, now, 0.22, 0.035, 'sine')
      scheduleTone(context, 523.25, now + 0.09, 0.3, 0.04, 'sine')
      scheduleTone(context, 659.25, now + 0.18, 0.42, 0.035, 'sine')
      return
    }

    const base = kind === 'select' ? 260 : kind === 'demo' ? 300 : 330
    const frequency = base + disk * 34
    scheduleTone(context, frequency, now, kind === 'select' ? 0.08 : 0.13, 0.026, 'sine')
    if (kind === 'move' || kind === 'demo') {
      scheduleTone(context, frequency * 1.5, now + 0.015, 0.1, 0.012, 'sine')
    }
  } catch {
    // Audio is progressive enhancement; ignore autoplay and device failures.
  }
}
