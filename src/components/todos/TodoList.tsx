'use client'

import { useState } from 'react'
import { Todo } from '@/types'

interface Props {
  todos: Todo[]
  activeTaskId: number | null
  filter: 'all' | 'active' | 'done'
  onFilterChange: (f: 'all' | 'active' | 'done') => void
  onAdd: (text: string, estPoms: number) => void
  onToggleDone: (id: number) => void
  onDelete: (id: number) => void
  onTogglePin: (id: number) => void
}

export function TodoList({
  todos, activeTaskId, filter, onFilterChange,
  onAdd, onToggleDone, onDelete, onTogglePin,
}: Props) {
  const [text, setText]   = useState('')
  const [estPoms, setEst] = useState(1)

  function handleAdd() {
    if (!text.trim()) return
    onAdd(text.trim(), estPoms)
    setText('')
    setEst(1)
  }

  const filtered = todos
    .filter(t =>
      filter === 'all'    ? true :
      filter === 'active' ? !t.done :
      t.done
    )

  const activeCount = todos.filter(t => !t.done).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: 'var(--muted)' }}>
          Tasks
        </span>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {(['all', 'active', 'done'] as const).map(f => (
              <button
                key={f}
                onClick={() => onFilterChange(f)}
                className="px-2.5 py-1 rounded-md font-mono text-[10px] tracking-wider uppercase transition-all duration-200"
                style={{
                  border: '0.5px solid',
                  borderColor: filter === f ? 'var(--border)' : 'transparent',
                  background:  filter === f ? 'var(--surface2)' : 'transparent',
                  color:       filter === f ? 'var(--text)' : 'var(--muted)',
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'var(--muted)' }}>
            {activeCount} {activeCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </div>

      {/* Add input */}
      <div className="flex gap-2 mb-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          placeholder="Add a task..."
          maxLength={120}
          className="flex-1 rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors"
          style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text)' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
        />
        <select
          value={estPoms}
          onChange={e => setEst(Number(e.target.value))}
          title="Estimated pomodoros"
          className="rounded-lg px-2 font-mono text-xs outline-none cursor-pointer"
          style={{ background: 'var(--surface2)', border: '0.5px solid var(--border)', color: 'var(--muted)' }}
        >
          {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <button
          onClick={handleAdd}
          className="px-4 rounded-xl font-mono text-xs font-medium tracking-wider transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
          style={{ background: 'var(--accent)', color: '#0f0f0f' }}
        >
          + Add
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs tracking-wider" style={{ color: 'var(--muted)' }}>
            {filter === 'done'   ? 'No completed tasks yet.' :
             filter === 'active' ? 'All done! Add a task above.' :
             'No tasks yet. Add one above.'}
          </div>
        ) : filtered.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            isActive={activeTaskId === todo.id}
            onToggleDone={() => onToggleDone(todo.id)}
            onDelete={() => onDelete(todo.id)}
            onTogglePin={() => onTogglePin(todo.id)}
          />
        ))}
      </div>
    </div>
  )
}

function TodoItem({
  todo, isActive, onToggleDone, onDelete, onTogglePin,
}: {
  todo: Todo
  isActive: boolean
  onToggleDone: () => void
  onDelete: () => void
  onTogglePin: () => void
}) {
  return (
    <div
      className="group relative flex items-start gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-300 animate-todoIn"
      style={{
        border:       `0.5px solid ${isActive ? 'var(--accent2)' : 'var(--border)'}`,
        background:   isActive ? 'rgba(232,213,176,0.03)' : 'var(--surface)',
      } as React.CSSProperties}
    >
      {/* Active left bar */}
      {isActive && (
        <span
          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
          style={{ background: 'var(--accent)' }}
        />
      )}

      {/* Checkbox */}
      <button
        onClick={onToggleDone}
        className="flex-shrink-0 mt-0.5 w-[18px] h-[18px] rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          border:     `0.5px solid ${todo.done ? '#70c99a' : 'var(--border)'}`,
          background: todo.done ? '#70c99a' : 'transparent',
        }}
      >
        {todo.done && (
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" stroke="#0f0f0f" strokeWidth="2" strokeLinecap="round">
            <polyline points="1.5,5 4,7.5 8.5,2.5"/>
          </svg>
        )}
      </button>

      {/* Text + pom pips */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-snug break-words transition-all duration-200"
          style={{
            color:          todo.done ? 'var(--muted)' : 'var(--text)',
            textDecoration: todo.done ? 'line-through' : 'none',
          }}
        >
          {todo.text}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          {Array.from({ length: todo.est_poms }, (_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-opacity duration-300"
              style={{ background: 'var(--accent2)', opacity: i < todo.poms_completed ? 1 : 0.25 }}
            />
          ))}
          <span className="font-mono text-[10px] ml-0.5" style={{ color: 'var(--muted)' }}>
            {todo.poms_completed}/{todo.est_poms}
          </span>
        </div>
      </div>

      {/* Actions — visible on hover */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <ActionBtn onClick={onTogglePin} title={todo.pinned ? 'Unset active' : 'Set as active'} active={todo.pinned}>
          <svg width="11" height="11" viewBox="0 0 24 24"
               fill={todo.pinned ? 'currentColor' : 'none'}
               stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </ActionBtn>
        <ActionBtn onClick={onDelete} title="Delete" danger>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6"  x2="6"  y2="18"/>
            <line x1="6"  y1="6"  x2="18" y2="18"/>
          </svg>
        </ActionBtn>
      </div>
    </div>
  )
}

function ActionBtn({
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
      className="w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150"
      style={{ border: '0.5px solid var(--border)', color: active ? 'var(--accent2)' : 'var(--muted)' }}
      onMouseEnter={e => {
        e.currentTarget.style.color = danger ? '#e87070' : 'var(--accent)'
        e.currentTarget.style.borderColor = danger ? '#e87070' : 'var(--accent)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = active ? 'var(--accent2)' : 'var(--muted)'
        e.currentTarget.style.borderColor = 'var(--border)'
      }}
    >
      {children}
    </button>
  )
}
