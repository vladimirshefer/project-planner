import { useMemo, useState } from 'react'
import { EstimationsGraph } from '../utils/estimations-graph'
import { SkillChipsInput } from './SkillChipsInput'
import { uniqueSkills } from '../utils/skills'

type WorkerDto = EstimationsGraph.WorkerDto
const AVAILABILITY_OPTIONS = [0, 25, 50, 75, 100] as const

export function WorkerPoolEditor({
  workers,
  onChange,
  suggestions = [],
}: {
  workers: WorkerDto[]
  onChange: (workers: WorkerDto[]) => void
  suggestions?: string[]
}) {
  const [newName, setNewName] = useState('')
  const normalizedWorkers = useMemo(() => workers ?? [], [workers])

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white border rounded p-3 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Worker name or email"
          className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={() => {
            const name = newName.trim()
            if (!name) return
            const worker: WorkerDto = {
              id: `w-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
              name,
              skills: [],
              availabilityPercent: 100,
            }
            onChange([worker, ...normalizedWorkers])
            setNewName('')
          }}
          className="px-3 py-1.5 text-sm rounded bg-cyan-600 text-white hover:bg-cyan-700"
        >
          Add worker
        </button>
      </div>

      {normalizedWorkers.length === 0 && (
        <div className="bg-white border rounded p-4 text-sm text-gray-500">
          No workers yet.
        </div>
      )}

      {normalizedWorkers.map((worker) => (
        <WorkerCard
          key={worker.id}
          worker={worker}
          suggestions={suggestions}
          onUpdate={(next) => onChange(normalizedWorkers.map((w) => (w.id === worker.id ? next : w)))}
          onDelete={() => onChange(normalizedWorkers.filter((w) => w.id !== worker.id))}
        />
      ))}
    </div>
  )
}

function WorkerCard({
  worker,
  suggestions,
  onUpdate,
  onDelete,
}: {
  worker: WorkerDto
  suggestions: string[]
  onUpdate: (worker: WorkerDto) => void
  onDelete: () => void
}) {
  const skillSuggestions = useMemo(
    () => uniqueSkills([...(suggestions ?? []), ...(worker.skills ?? [])]),
    [suggestions, worker.skills]
  )

  return (
    <div className="bg-white border rounded p-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          value={worker.name}
          onChange={(e) => onUpdate({ ...worker, name: e.target.value })}
          className="flex-1 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={onDelete}
          className="px-2.5 py-1.5 text-sm rounded border border-red-200 text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Availability</span>
        {AVAILABILITY_OPTIONS.map((option) => {
          const active = (worker.availabilityPercent ?? 100) === option
          return (
            <button
              key={option}
              type="button"
              onClick={() => onUpdate({ ...worker, availabilityPercent: option })}
              className={`px-2 py-0.5 text-xs rounded-full border ${active ? 'bg-cyan-600 text-white border-cyan-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              {option}%
            </button>
          )
        })}
      </div>

      <SkillChipsInput
        value={worker.skills ?? []}
        suggestions={skillSuggestions}
        onChange={(skills) => onUpdate({ ...worker, skills })}
        placeholder="Type skill and press Enter"
      />
    </div>
  )
}
