'use client'

interface Props {
  user: { id: string; name: string; avatar?: string; email?: string }
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onToggleSettings: () => void
  onToggleStats: () => void
  onSignOut: () => void
  showStats: boolean
  showSettings: boolean
}

export function Topbar({
  user, theme, onToggleTheme, onToggleSettings, onToggleStats, onSignOut, showStats, showSettings,
}: Props) {
  const initials = user.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center justify-between mb-6">
      <span className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: 'var(--muted)' }}>
        Focus
      </span>

      <div className="flex items-center gap-2">
        {/* Stats */}
        <IconBtn onClick={onToggleStats} title="Stats" active={showStats}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6"  y1="20" x2="6"  y2="14"/>
          </svg>
        </IconBtn>

        {/* Theme */}
        <IconBtn onClick={onToggleTheme} title="Toggle theme">
          {theme === 'dark' ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1"  x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1"  y1="12" x2="3"  y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </IconBtn>

        {/* Settings */}
        <IconBtn onClick={onToggleSettings} title="Settings" active={showSettings}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </IconBtn>

        {/* Divider */}
        <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />

        {/* Avatar */}
        {user.avatar ? (
          <img src={user.avatar} alt={user.name}
            className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium flex-shrink-0"
               style={{ background: 'rgba(232,213,176,0.12)', border: '0.5px solid var(--accent2)', color: 'var(--accent)' }}>
            {initials}
          </div>
        )}

        {/* Name */}
        <span className="font-mono text-xs hidden sm:block" style={{ color: 'var(--muted)' }}>
          {user.name.split(' ')[0]}
        </span>

        {/* Sign out */}
        <IconBtn onClick={onSignOut} title="Sign out" danger>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({
  children, onClick, title, active, danger,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105"
      style={{
        border: '0.5px solid var(--border)',
        background: active ? 'rgba(232,213,176,0.08)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = danger ? '#e87070' : 'var(--accent)'
        e.currentTarget.style.color = danger ? '#e87070' : 'var(--accent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.color = active ? 'var(--accent)' : 'var(--muted)'
      }}
    >
      {children}
    </button>
  )
}
