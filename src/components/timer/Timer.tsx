'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { UserSettings, TimerMode, Todo } from '@/types'

const CIRCUMFERENCE = 2 * Math.PI * 90

interface Props {
  settings: UserSettings
  activeTask: Todo | null
  onWorkSessionComplete: (durationSec: number) => void
}

export function Timer({ settings, activeTask, onWorkSessionComplete }: Props) {
  const [mode, setMode]           = useState<TimerMode>('work')
  const [running, setRunning]     = useState(false)
  const [session, setSession]     = useState(1)
  const [completedSessions, setCompleted] = useState(0)
  const [remainSec, setRemainSec] = useState(() => settings.work_min * 60)
  const [totalSec, setTotalSec]   = useState(() => settings.work_min * 60)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onEndRef    = useRef<() => void>(() => {})

  // Recompute duration when settings or mode changes
  useEffect(() => {
    pause()
    const dur = getModeDuration(mode, settings)
    setTotalSec(dur)
    setRemainSec(dur)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.work_min, settings.short_min, settings.long_min])

  // Keep onEnd ref fresh so the interval closure is always current
  useEffect(() => {
    onEndRef.current = () => {
      if (mode === 'work') {
        onWorkSessionComplete(getModeDuration('work', settings))
        setCompleted(prev => {
          const next = prev + 1
          const nextMode: TimerMode = next % settings.sessions_per_cycle === 0 ? 'long' : 'short'
          setMode(nextMode)
          if (settings.auto_break) setTimeout(start, 900)
          return next
        })
      } else {
        setSession(prev => mode === 'long' ? 1 : prev + 1)
        setMode('work')
        if (settings.auto_work) setTimeout(start, 900)
      }
    }
  })

  function start() {
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setRemainSec(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          onEndRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  function pause() {
    clearInterval(intervalRef.current!)
    setRunning(false)
  }

  function reset() {
    pause()
    const dur = getModeDuration(mode, settings)
    setTotalSec(dur)
    setRemainSec(dur)
  }

  function skip() {
    pause()
    onEndRef.current()
  }

  function toggleTimer() { running ? pause() : start() }

  function switchMode(m: TimerMode) {
    pause()
    setMode(m)
  }

  const progress = totalSec > 0 ? remainSec / totalSec : 1
  const offset   = CIRCUMFERENCE * (1 - progress)
  const color    = getModeColor(mode)

  return (
    <div
      className="rounded-3xl border mb-5 overflow-hidden relative"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {running && <div className="timer-running absolute inset-x-0 top-0 h-0 pointer-events-none" />}

      {/* Mode tabs */}
      <div className="flex gap-1.5 p-4 pb-0">
        {(['work', 'short', 'long'] as TimerMode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className="flex-1 py-2 rounded-lg font-mono text-[10px] tracking-wider uppercase transition-all duration-200"
            style={{
              border: '0.5px solid',
              borderColor: mode === m ? color : 'var(--border)',
              color:       mode === m ? color : 'var(--muted)',
              background:  mode === m ? `${color}18` : 'transparent',
            }}
          >
            {m === 'work' ? 'Work' : m === 'short' ? 'Short' : 'Long'}
          </button>
        ))}
      </div>

      <div className="px-8 pt-5 pb-6 text-center">
        {/* Session label */}
        <div className="font-mono text-[10px] tracking-[0.15em] uppercase mb-3" style={{ color: 'var(--muted)' }}>
          Session <span style={{ color }}>{session} / {settings.sessions_per_cycle}</span>
        </div>

        {/* Ring */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="100" cy="100" r="90" fill="none" stroke="var(--border)" strokeWidth="4" />
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={offset}
              className="ring-progress"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-mono text-4xl font-medium tracking-tight leading-none transition-colors duration-300"
              style={{ color }}
            >
              {formatTime(remainSec)}
            </span>
            <span
              className="w-1.5 h-1.5 rounded-full mt-2 transition-colors duration-300"
              style={{ background: color }}
            />
          </div>
        </div>

        {/* Active task chip */}
        {activeTask && (
          <div
            className="mb-3 px-3 py-1.5 rounded-lg font-mono text-xs truncate max-w-xs mx-auto"
            style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '0.5px solid var(--border)' }}
            title={activeTask.text}
          >
            ★ {activeTask.text}
          </div>
        )}

        {/* Session dots */}
        <div className="flex gap-1.5 justify-center mb-5">
          {Array.from({ length: settings.sessions_per_cycle }, (_, i) => {
            const isCurrent = i + 1 === session && mode === 'work'
            const isDone    = i + 1 < session
            return (
              <span
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width:      isCurrent ? '10px' : '8px',
                  height:     isCurrent ? '10px' : '8px',
                  background: isDone    ? 'var(--accent)'
                            : isCurrent ? 'var(--accent2)'
                            : 'var(--border)',
                  boxShadow:  isCurrent ? '0 0 6px var(--accent2)' : 'none',
                }}
              />
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <CtrlBtn onClick={skip} title="Skip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="5 4 15 12 5 20"/>
              <line x1="19" y1="4" x2="19" y2="20"/>
            </svg>
          </CtrlBtn>

          <button
            onClick={toggleTimer}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            style={{ background: color, color: '#0f0f0f' }}
          >
            {running ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            )}
          </button>

          <CtrlBtn onClick={reset} title="Reset">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="1,4 1,10 7,10"/>
              <path d="M3.51 15a9 9 0 1 0 .49-3.77"/>
            </svg>
          </CtrlBtn>
        </div>
      </div>
    </div>
  )
}

function CtrlBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
      style={{ border: '0.5px solid var(--border)', color: 'var(--muted)' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
    >
      {children}
    </button>
  )
}

function getModeDuration(mode: TimerMode, s: UserSettings) {
  return mode === 'work' ? s.work_min * 60 : mode === 'short' ? s.short_min * 60 : s.long_min * 60
}

function getModeColor(mode: TimerMode) {
  return mode === 'work' ? 'var(--accent)' : mode === 'short' ? '#70c99a' : '#70a8c9'
}

function formatTime(s: number) {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m < 10 ? '0' : ''}${m}:${sec < 10 ? '0' : ''}${sec}`
}
