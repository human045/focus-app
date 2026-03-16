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
  user: { id: string; name: string; avatar?: string; email?: string } | null  // add | null
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

export function DashboardClient({ user, initialTodos, initialSettings, initialStats }: Props) {
  const supabase = createClient()

  const [todos, setTodos]           = useState<Todo[]>(initialTodos)
  const [settings, setSettings]     = useState<UserSettings>(
    initialSettings || { ...DEFAULT_SETTINGS, user_id: user.id }
  )
  const [stats, setStats]           = useState<DailyStats[]>(initialStats)
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats]   = useState(false)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    initialTodos.find(t => t.pinned && !t.done)?.id ?? null
  )
  const [theme, setTheme]           = useState<'dark' | 'light'>(initialSettings?.theme || 'dark')
  const [filter, setFilter]         = useState<'all' | 'active' | 'done'>('all')

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('focus-theme', theme)
  }, [theme])

  // ── SETTINGS ──────────────────────────────────────────
  const saveSettings = useCallback(async (next: UserSettings) => {
    setSettings(next)
    await supabase.from('user_settings').upsert({ ...next, user_id: user.id })
  }, [supabase, user.id])

  const toggleTheme = useCallback(() => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    saveSettings({ ...settings, theme: next })
  }, [theme, settings, saveSettings])

  // ── TODOS ──────────────────────────────────────────────
  const addTodo = useCallback(async (text: string, estPoms: number) => {
    const { data, error } = await supabase
      .from('todos')
      .insert({ user_id: user.id, text, est_poms: estPoms })
      .select()
      .single()
    if (!error && data) setTodos(prev => [data, ...prev])
  }, [supabase, user.id])

  const toggleDone = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const updates = { done: !todo.done, ...((!todo.done) ? { pinned: false } : {}) }
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    if (!todo.done && activeTaskId === id) setActiveTaskId(null)
    await supabase.from('todos').update(updates).eq('id', id)
  }, [todos, activeTaskId, supabase])

  const deleteTodo = useCallback(async (id: number) => {
    setTodos(prev => prev.filter(t => t.id !== id))
    if (activeTaskId === id) setActiveTaskId(null)
    await supabase.from('todos').delete().eq('id', id)
  }, [activeTaskId, supabase])

  const togglePin = useCallback(async (id: number) => {
    const todo = todos.find(t => t.id === id)
    if (!todo) return
    const pinned = !todo.pinned
    setTodos(prev => prev.map(t => ({ ...t, pinned: t.id === id ? pinned : false })))
    setActiveTaskId(pinned ? id : (activeTaskId === id ? null : activeTaskId))
    // unpin all others, then set this one
    await supabase.from('todos').update({ pinned: false }).eq('user_id', user.id).neq('id', id)
    await supabase.from('todos').update({ pinned }).eq('id', id)
  }, [todos, activeTaskId, supabase, user.id])

  // ── SESSION COMPLETE ───────────────────────────────────
  const onWorkSessionComplete = useCallback(async (durationSec: number) => {
    await supabase.from('pomo_sessions').insert({
      user_id: user.id,
      mode: 'work',
      duration: durationSec,
      todo_id: activeTaskId,
      completed: true,
    })

    if (activeTaskId) {
      const todo = todos.find(t => t.id === activeTaskId)
      if (todo) {
        const poms_completed = todo.poms_completed + 1
        setTodos(prev => prev.map(t => t.id === activeTaskId ? { ...t, poms_completed } : t))
        await supabase.from('todos').update({ poms_completed }).eq('id', activeTaskId)
      }
    }

    // Refresh stats
    const { data } = await supabase
      .from('daily_focus_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('day', { ascending: false })
      .limit(30)
    if (data) setStats(data)
  }, [supabase, user.id, activeTaskId, todos])

  // ── SIGN OUT ───────────────────────────────────────────
  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }, [supabase])

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

        {showStats && (
          <StatsPanel
            stats={stats}
            todos={todos}
            onClose={() => setShowStats(false)}
          />
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
