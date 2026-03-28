import { useMemo, useState } from 'react'
import { EstimationsGraph } from '../utils/estimations-graph'

type WorkerDto = EstimationsGraph.WorkerDto

export function WorkerPoolEditor({
  workers,
  onChange,
}: {
  workers: WorkerDto[]
  onChange: (workers: WorkerDto[]) => void
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
          onUpdate={(next) => onChange(normalizedWorkers.map((w) => (w.id === worker.id ? next : w)))}
          onDelete={() => onChange(normalizedWorkers.filter((w) => w.id !== worker.id))}
        />
      ))}
    </div>
  )
}

function WorkerCard({
  worker,
  onUpdate,
  onDelete,
}: {
  worker: WorkerDto
  onUpdate: (worker: WorkerDto) => void
  onDelete: () => void
}) {
  const [skillInput, setSkillInput] = useState('')

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

      <div className="flex items-center gap-2">
        <input
          value={skillInput}
          onChange={(e) => setSkillInput(e.target.value)}
          placeholder="Add skill (e.g. backend)"
          className="flex-1 border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={() => {
            const normalized = normalizeSkill(skillInput)
            if (!normalized) return
            onUpdate({ ...worker, skills: Array.from(new Set([...(worker.skills ?? []), normalized])) })
            setSkillInput('')
          }}
          className="px-2.5 py-1.5 text-xs rounded bg-slate-700 text-white hover:bg-slate-800"
        >
          Add skill
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {(worker.skills ?? []).map((skill) => (
          <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border bg-sky-50 text-sky-700 border-sky-200">
            {skill}
            <button
              onClick={() => onUpdate({ ...worker, skills: (worker.skills ?? []).filter((s) => s !== skill) })}
              className="text-red-600"
            >
              x
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}

function normalizeSkill(skill: string): string {
  return skill.trim().toLowerCase()
}
