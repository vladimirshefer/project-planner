import { useEffect, useMemo, useRef, useState } from 'react'
import { normalizeSkill, skillColorClass, uniqueSkills } from '../utils/skills'

export function SkillChipsInput({
  value,
  onChange,
  suggestions,
  placeholder = 'Add skill...',
  inputClassName = 'text-xs',
}: {
  value: string[]
  onChange: (skills: string[]) => void
  suggestions: string[]
  placeholder?: string
  inputClassName?: string
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const selected = useMemo(() => uniqueSkills(value ?? []), [value])
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const filtered = useMemo(() => {
    const q = normalizeSkill(query)
    return uniqueSkills(suggestions ?? []).filter((skill) => {
      if (selectedSet.has(skill)) return false
      if (!q) return true
      return skill.includes(q)
    })
  }, [query, selectedSet, suggestions])

  const addSkill = (raw: string) => {
    const normalized = normalizeSkill(raw)
    if (!normalized) return
    if (selectedSet.has(normalized)) {
      setQuery('')
      setIsOpen(false)
      return
    }
    onChange([...selected, normalized])
    setQuery('')
    setIsOpen(false)
    setActiveIndex(0)
  }

  useEffect(() => {
    if (!isOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [isOpen])

  useEffect(() => {
    if (activeIndex < filtered.length) return
    setActiveIndex(0)
  }, [activeIndex, filtered.length])

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex flex-wrap items-center gap-1 rounded border bg-white px-1.5 py-1 focus-within:ring-1 focus-within:ring-cyan-500">
        {selected.map((skill) => (
          <span
            key={skill}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${skillColorClass(skill)}`}
          >
            {skill}
            <button
              type="button"
              className="text-[11px] leading-none text-gray-500 hover:text-red-600"
              onClick={() => onChange(selected.filter((s) => s !== skill))}
              aria-label={`Remove ${skill}`}
            >
              x
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
            setActiveIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              if (filtered.length === 0) return
              e.preventDefault()
              setIsOpen(true)
              setActiveIndex((idx) => (idx + 1) % filtered.length)
              return
            }
            if (e.key === 'ArrowUp') {
              if (filtered.length === 0) return
              e.preventDefault()
              setIsOpen(true)
              setActiveIndex((idx) => (idx - 1 + filtered.length) % filtered.length)
              return
            }
            if (e.key === 'Escape') {
              setIsOpen(false)
              return
            }
            if (e.key === 'Backspace' && !query) {
              if (selected.length === 0) return
              onChange(selected.slice(0, -1))
              return
            }
            if (e.key === 'Enter') {
              e.preventDefault()
              if (isOpen && filtered.length > 0) {
                addSkill(filtered[activeIndex] ?? '')
                return
              }
              addSkill(query)
            }
          }}
          className={`min-w-[90px] flex-1 bg-transparent outline-none ${inputClassName}`}
          placeholder={selected.length === 0 ? placeholder : ''}
        />
      </div>

      {isOpen && (filtered.length > 0 || normalizeSkill(query)) && (
        <div className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded border bg-white p-1 shadow-lg">
          {filtered.map((skill, idx) => {
            const active = idx === activeIndex
            return (
              <button
                type="button"
                key={skill}
                onClick={() => addSkill(skill)}
                className={`mb-1 flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs last:mb-0 ${active ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <span>{skill}</span>
                <span className="text-[10px] text-gray-400">add</span>
              </button>
            )
          })}
          {normalizeSkill(query) && (
            <button
              type="button"
              onClick={() => addSkill(query)}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-blue-700 hover:bg-blue-50"
            >
              <span>Create: {normalizeSkill(query)}</span>
              <span className="text-[10px] text-blue-500">enter</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
