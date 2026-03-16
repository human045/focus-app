'use client'

import { UserSettings } from '@/types'

interface Props {
  settings: UserSettings
  onChange: (s: UserSettings) => void
  onClose: () => void
}

export function SettingsPanel({ settings, onChange, onClose }: Props) {
  function update(key: keyof UserSettings, value: number | boolean) {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div className="rounded-2xl border p-5 mb-5 animate-fadeUp"
         style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs tracking-widest uppercase" style={{ color: 'var(--muted)' }}>
          Timer settings
        </span>
        <button onClick={onClose} className="text-lg leading-none transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}>
          ×
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {([
          ['work_min',           'Work (min)',         1, 90],
          ['short_min',         'Short break (min)',  1, 30],
          ['long_min',          'Long break (min)',   1, 60],
          ['sessions_per_cycle','Sessions / cycle',   2,  8],
        ] as [keyof UserSettings, string, number, number][]).map(([key, label, min, max]) => (
          <div key={String(key)}>
            <label className="block font-mono text-[10px] tracking-wider uppercase mb-1.5"
                   style={{ color: 'var(--muted)' }}>
              {label}
            </label>
            <input
              type="number"
              min={min}
              max={max}
              value={settings[key] as number}
              onChange={e => update(key, parseInt(e.target.value) || min)}
              className="w-full rounded-lg px-3 py-2 font-mono text-sm font-medium outline-none transition-colors"
              style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', color: 'var(--text)' }}
              onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
              onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        ))}
      </div>

      <div className="space-y-3 pt-1">
        {([
          ['auto_break', 'Auto-start breaks'],
          ['auto_work',  'Auto-start work'],
        ] as [keyof UserSettings, string][]).map(([key, label]) => (
          <div key={String(key)} className="flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wider uppercase" style={{ color: 'var(--muted)' }}>
              {label}
            </span>
            <Toggle
              checked={settings[key] as boolean}
              onChange={v => update(key, v)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors duration-300"
      style={{ background: checked ? 'var(--accent)' : 'var(--border)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-300"
        style={{
          background: checked ? '#0f0f0f' : 'var(--muted)',
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
        }}
      />
    </button>
  )
}
