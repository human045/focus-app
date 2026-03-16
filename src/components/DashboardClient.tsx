'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Todo, UserSettings, DailyStats } from '@/types'
import { Timer } from '@/components/timer/Timer'
import { TodoList } from '@/components/todos/TodoList'
import { StatsPanel } from '@/components/stats/StatsPanel'
import { SettingsPanel } from '@/components/ui/SettingsPanel'
import { Topbar } from '@/components/ui/Topbar'

interface Props {
  user: { id: string; name: string; avatar?: string; email?: string } | null
  initialTodos: Todo[]
  initialSettings: UserSettings | null
  initialStats: DailyStats[]
}

const DEFAULT_SETTINGS: Omit<UserSettings, 'user_id'> = {
  work_min: 25,
  short_min: 5,
  long_min: 15,
  sessions_per_cycle: 4,
  auto_break: true,
  auto_work: false,
  theme: 'dark',
}

const GUEST_TODOS_KEY    = 'focus-guest-todos'
const GUEST_SETTINGS_KEY = 'focus-guest-settings'

function loadGuestTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(GUEST_TODOS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveGuestTodos(todos: Todo[]) {
  try { localStorage.setItem(GUEST_TODOS_KEY, JSON.stringify(todos)) } catch {}
}

function loadGuestSettings(): Omit<UserSettings, 'user_id'> {
  try {
    const raw = localStorage.getItem(GUEST_SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch { return DEFAULT_SETTINGS }
}

function saveGuestSettings(s: Omit<UserSettings, 'user_id'>) {
  try { localStorage.setItem(GUEST_SETTINGS_KEY, JSON.stringify(s)) } catch {}
}

export function DashboardClient({ user, initialTodos, initialSettings, initialStats }: Props) {
  const supabase = createClient()
  const isGuest  = !user

  const [todos, setTodos]               = useState<Todo[]>(initialTodos)
  const [settings, setSettings]         = useState<UserSettings>(
    initialSettings || { ...DEFAULT_SETTINGS, user_id: '' }
  )
  const [stats, setStats]               = useState<DailyStats[]>(initialStats)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats]       = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    initialTodos.find(t => t.pinned && !t.done)?.id ?? null
  )
  const [theme, setTheme]               = useState<'dark' | 'light'>(
    initialSettings?.theme || 'dark'
  )
  const [filter, setFilter]             = useState<'all' | 'active' | 'done'>('all')
  const [guestNextId, setGuestNextId]   = useState(1)

  // Load guest data from localStorage on mount
  useEffect(() => {
    if (!isGuest) return
    const savedTodos    = loadGuestTodos()
    const savedSettings = loadGuestSettings()
    const savedTheme    = (localStorage.getItem('focus-theme') as 'dark' | 'light') || 'dark'
    setTodos(savedTodos)
    setSettings({ ...savedSettings, user_id: '' })
    setTheme(savedTheme)
    setActiveTaskId(savedTodos.find((t: Todo) => t.pinned && !t.done)?.id ?? null)
    if (savedTodos.length > 0) {
      setGuestNextId(Math.max(...savedTodos.map((t: Todo) => t.id)) + 1)
    }
  }, [isGuest])

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('focus-theme', theme)
  }, [theme])

  // SETTINGS
  const saveSettings = useCallback(async (next: UserSettings) => {
    setSettings(next)
    if (isGuest) {
      saveGuestSettings(next)
    } else {
      await supabase.from('user_settings').upsert({ ...next, user_id: user!.id })
    }
  }, [isGuest, supabase, user])

  const toggleTheme = useCallback(() => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveSettings({ ...settings, theme: next })
  }, [theme, settings, saveSettings])

  // TODOS
  const addTodo = useCallback(async (text: string, estPoms: number) => {
    if (isGuest) {
      const newTodo: Todo = {
        id:             guestNextId,
        user_id:        'guest',
        text,
        done:           false,
        pinned:         false,
        est_poms:       estPoms,
        poms_completed: 0,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
      }
      const updated = [newTodo, ...todos]
      setTodos(updated)
      saveGuestTodos(updated)
      setGuestNextId(prev => prev + 1)
    } else {
      const { data, error } = await supabase
        .from('todos')
        .insert({ user_id: user!.id, text, est_poms: estPoms })
        .select()
        .single()
      if (!error && data) setTodos(prev => [data, ...prev])
    }
  }, [isGuest, todos, guestNextId, supabase, user])

  const toggleDone = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const updates = { done: !todo.done, ...(!todo.done ? { pinned: false } : {}) }
    const updated = todos.map(t => t.id === id ? { ...t, ...updates } : t)
    setTodos(updated)
    if (!todo.done && activeTaskId === id) setActiveTaskId(null)
    if (isGuest) {
      saveGuestTodos(updated)
    } else {
      await supabase.from('todos').update(updates).eq('id', id)
    }
  }, [todos, activeTaskId, isGuest, supabase])

  const deleteTodo = useCallback(async (id: number) => {
    const updated = todos.filter(t => t.id !== id)
    setTodos(updated)
    if (activeTaskId === id) setActiveTaskId(null)
    if (isGuest) {
      saveGuestTodos(updated)
    } else {
      await supabase.from('todos').delete().eq('id', id)
    }
  }, [todos, activeTaskId, isGuest, supabase])

  const togglePin = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const pinned  = !todo.pinned
    const updated = todos.map(t => ({ ...t, pinned: t.id === id ? pinned : false }))
    setTodos(updated)
    setActiveTaskId(pinned ? id : (activeTaskId === id ? null : activeTaskId))
    if (isGuest) {
      saveGuestTodos(updated)
    } else {
      await supabase.from('todos').update({ pinned: false }).eq('user_id', user!.id).neq('id', id)
      await supabase.from('todos').update({ pinned }).eq('id', id)
    }
  }, [todos, activeTaskId, isGuest, supabase, user])

  // SESSION COMPLETE
  const onWorkSessionComplete = useCallback(async (durationSec: number) => {
    if (!isGuest && user) {
      await supabase.from('pomo_sessions').insert({
        user_id:   user.id,
        mode:      'work',
        duration:  durationSec,
        todo_id:   activeTaskId,
        completed: true,
      })
      const { data } = await supabase
        .from('daily_focus_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('day', { ascending: false })
        .limit(30)
      if (data) setStats(data)
    }

    if (activeTaskId) {
      const todo = todos.find(t => t.id === activeTaskId)
      if (todo) {
        const poms_completed = todo.poms_completed + 1
        const updated = todos.map(t => t.id === activeTaskId ? { ...t, poms_completed } : t)
        setTodos(updated)
        if (isGuest) {
          saveGuestTodos(updated)
        } else {
          await supabase.from('todos').update({ poms_completed }).eq('id', activeTaskId)
        }
      }
    }
  }, [isGuest, supabase, user, activeTaskId, todos])

  // MIGRATE guest todos on login
  useEffect(() => {
    if (isGuest || !user) return
    const guestTodos = loadGuestTodos()
    if (guestTodos.length === 0) return

    async function migrate() {
      for (const t of guestTodos) {
        await supabase.from('todos').insert({
          user_id:        user!.id,
          text:           t.text,
          done:           t.done,
          pinned:         false,
          est_poms:       t.est_poms,
          poms_completed: t.poms_completed,
        })
      }
      localStorage.removeItem(GUEST_TODOS_KEY)
      const { data } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (data) setTodos(data)
    }
    migrate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/dashboard'
  }, [supabase])

  const signIn = useCallback(() => {
    window.location.href = '/auth'
  }, [])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-lg mx-auto px-4 py-6 pb-16">
        <Topbar
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onToggleSettings={() => setShowSettings(v => !v)}
          onToggleStats={() => { setShowStats(v => !v); setShowSettings(false) }}
          onSignOut={signOut}
          onSignIn={signIn}
          showStats={showStats}
          showSettings={showSettings}
        />

        {showSettings && (
          <SettingsPanel
            settings={settings}
            onChange={saveSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {showStats && !isGuest && (
          <StatsPanel
            stats={stats}
            todos={todos}
            onClose={() => setShowStats(false)}
          />
        )}

        {showStats && isGuest && (
          <div className="rounded-2xl border p-5 mb-5 text-center animate-fadeUp"
               style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Sign in to track streaks and focus stats across devices.
            </p>
            <button onClick={signIn}
              className="px-5 py-2 rounded-xl font-mono text-xs font-medium tracking-wider transition-all hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#0f0f0f' }}>
              Sign in
            </button>
          </div>
        )}

        <Timer
          settings={settings}
          activeTask={todos.find(t => t.id === activeTaskId) ?? null}
          onWorkSessionComplete={onWorkSessionComplete}
        />

        <TodoList
          todos={todos}
          activeTaskId={activeTaskId}
          filter={filter}
          onFilterChange={setFilter}
          onAdd={addTodo}
          onToggleDone={toggleDone}
          onDelete={deleteTodo}
          onTogglePin={togglePin}
        />
      </div>
    </div>
  )
}
