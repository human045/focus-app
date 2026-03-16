'use client'

import { DailyStats, Todo } from '@/types'
import { format, subDays, differenceInCalendarDays, parseISO } from 'date-fns'

interface Props {
  stats: DailyStats[]
  todos: Todo[]
  onClose: () => void
}

export function StatsPanel({ stats, todos, onClose }: Props) {
  const today       = new Date()
  const streak      = computeStreak(stats)
  const totalSecs   = stats.reduce((s, d) => s + (Number(d.focus_seconds) || 0), 0)
  const totalHours  = (totalSecs / 3600).toFixed(1)
  const totalSessions = stats.reduce((s, d) => s + (Number(d.work_sessions) || 0), 0)
  const doneTodos   = todos.filter(t => t.done).length

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d   = subDays(today, 13 - i)
    const key = format(d, 'yyyy-MM-dd')
    const row = stats.find(s => s.day.startsWith(key))
    return { date: d, sessions: Number(row?.work_sessions || 0) }
  })
  const maxSessions = Math.max(...last14.map(d => d.sessions), 1)

  return (
    <div className="rounded-2xl border p-5 mb-5 animate-fadeUp"
         style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          Focus stats
        </span>
        <button onClick={onClose} className="text-lg leading-none transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}>
          ×
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        {[
          { label: 'Day streak',       value: String(streak),         unit: streak === 1 ? 'day' : 'days' },
          { label: 'Total focus',      value: totalHours,             unit: 'hours' },
          { label: 'Sessions done',    value: String(totalSessions),  unit: 'pomodoros' },
          { label: 'Tasks completed',  value: String(doneTodos),      unit: 'tasks' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="rounded-xl p-3.5" style={{ background: 'var(--surface2)' }}>
            <div className="font-mono text-[10px] tracking-wider uppercase mb-1.5" style={{ color: 'var(--muted)' }}>
              {label}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-medium" style={{ color: 'var(--accent)' }}>
                {value}
              </span>
              <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 14-day bar chart */}
      <div className="font-mono text-[10px] tracking-wider uppercase mb-3" style={{ color: 'var(--muted)' }}>
        Last 14 days
      </div>
      <div className="flex items-end gap-1 h-20">
        {last14.map(({ date, sessions }, i) => {
          const isToday = differenceInCalendarDays(today, date) === 0
          const height  = sessions === 0
            ? 4
            : Math.max(8, Math.round((sessions / maxSessions) * 80))
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${format(date, 'MMM d')}: ${sessions} session${sessions !== 1 ? 's' : ''}`}
            >
              <div
                className="w-full rounded-sm transition-all duration-500"
                style={{
                  height:     `${height}px`,
                  background: sessions === 0 ? 'var(--border)'
                            : isToday       ? 'var(--accent)'
                            : 'var(--accent2)',
                  opacity:    sessions === 0 ? 0.4 : 1,
                }}
              />
              {i % 3 === 0 && (
                <span className="font-mono text-[8px]" style={{ color: 'var(--muted)' }}>
                  {format(date, 'd')}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {streak > 0 && (
        <p className="mt-4 text-xs text-center font-mono" style={{ color: 'var(--muted)' }}>
          {streak >= 7
            ? `${streak}-day streak — impressive, keep going.`
            : `Focus every day to grow your streak.`}
        </p>
      )}
    </div>
  )
}

function computeStreak(stats: DailyStats[]): number {
  if (!stats.length) return 0
  const today     = format(new Date(), 'yyyy-MM-dd')
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd')

  const activeDays = stats
    .filter(s => Number(s.work_sessions) > 0)
    .map(s => s.day.slice(0, 10))
    .sort()
    .reverse()

  if (!activeDays.length) return 0
  if (activeDays[0] !== today && activeDays[0] !== yesterday) return 0

  let streak = 0
  let check  = activeDays[0]

  for (const day of activeDays) {
    if (day === check) {
      streak++
      check = format(subDays(parseISO(check), 1), 'yyyy-MM-dd')
    } else {
      break
    }
  }
  return streak
}
