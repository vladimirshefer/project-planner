import { useEffect, useRef, useState } from 'react'
import { Handle, Position } from '@xyflow/react'
import { EstimationsGraph } from '../utils/estimations-graph'
import { ProjectStats } from '../utils/project-stats'
import { SkillChipsInput } from './SkillChipsInput'
import { skillColorClass, uniqueSkills } from '../utils/skills'

type NodeData = EstimationsGraph.NodeData
type Priority = EstimationsGraph.Priority

const PRIORITY_COLORS: Record<Priority, string> = {
  minor: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  major: 'bg-orange-50 text-orange-600 border-orange-200',
  critical: 'bg-red-50 text-red-600 border-red-200',
}

const RISK_COLORS: Record<ProjectStats.RiskLevel, string> = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  extreme: 'bg-red-50 text-red-700 border-red-200',
}

export function NodeView({
  data,
  workers,
  skillSuggestions,
  priorities,
  riskLevels,
  totals,
  onUpdateData,
  onDeleteNode,
}: {
  data: NodeData
  workers: EstimationsGraph.WorkerDto[]
  skillSuggestions: string[]
  priorities: Priority[]
  riskLevels: ProjectStats.RiskLevel[]
  totals: ReturnType<typeof ProjectStats.extractViewMarks> | null
  onUpdateData: (key: keyof NodeData, value: any) => void
  onDeleteNode: () => void
}) {
  const [isHardStopEnabled, setIsHardStopEnabled] = useState(data.limit !== undefined && data.limit !== null)
  const [isSkillsEnabled, setIsSkillsEnabled] = useState((data.requiredSkills?.length ?? 0) > 0)
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const assigneeMenuRef = useRef<HTMLDivElement | null>(null)
  const optionsMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (data.limit !== undefined && data.limit !== null) {
      setIsHardStopEnabled(true)
    }
  }, [data.limit])

  useEffect(() => {
    if ((data.requiredSkills?.length ?? 0) > 0) {
      setIsSkillsEnabled(true)
    }
  }, [data.requiredSkills])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (isAssigneeOpen && assigneeMenuRef.current && !assigneeMenuRef.current.contains(target)) {
        setIsAssigneeOpen(false)
      }
      if (isOptionsOpen && optionsMenuRef.current && !optionsMenuRef.current.contains(target)) {
        setIsOptionsOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsAssigneeOpen(false)
      setIsOptionsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isAssigneeOpen, isOptionsOpen])

  const assigneeIds = data.assigneeIds ?? []
  const assignees = workers.filter((worker) => assigneeIds.includes(worker.id))
  const primaryAssignee = assignees[0]
  const primaryInitials = getInitials(primaryAssignee?.name ?? 'Unassigned')
  const requiredSkills = data.requiredSkills ?? []
  const skillsForPicker = uniqueSkills([...(skillSuggestions ?? []), ...requiredSkills])

  return (
    <div className="rounded border bg-white p-2.5 shadow-md min-w-[180px] flex flex-col gap-2">
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-between -mb-1">
        <div className="relative" ref={assigneeMenuRef}>
          <button
            type="button"
            aria-expanded={isAssigneeOpen}
            onClick={() => {
              setIsAssigneeOpen((open) => !open)
              setIsOptionsOpen(false)
            }}
            className="cursor-pointer select-none rounded-full"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold text-gray-700 bg-gray-50">
              {primaryInitials}
            </span>
          </button>
          {isAssigneeOpen && (
            <div className="absolute left-0 mt-1 bg-white border rounded shadow-md z-10 min-w-[180px] max-h-[180px] overflow-auto p-1">
              {workers.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-gray-500">No workers</div>
              )}
              {workers.map((worker) => {
                const checked = assigneeIds.includes(worker.id)
                return (
                  <label key={worker.id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...assigneeIds, worker.id]
                          : assigneeIds.filter((id) => id !== worker.id)
                        onUpdateData('assigneeIds', Array.from(new Set(next)))
                      }}
                    />
                    <span className="truncate">{worker.name}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div className="relative" ref={optionsMenuRef}>
          <button
            type="button"
            aria-expanded={isOptionsOpen}
            onClick={() => {
              setIsOptionsOpen((open) => !open)
              setIsAssigneeOpen(false)
            }}
            className="list-none cursor-pointer select-none text-xs text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100"
          >
            ...
          </button>
          {isOptionsOpen && (
            <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 min-w-[190px] p-1">
              <button
                type="button"
                onClick={() => {
                  if (isHardStopEnabled) {
                    onUpdateData('limit', undefined)
                    setIsHardStopEnabled(false)
                  } else {
                    setIsHardStopEnabled(true)
                  }
                  setIsOptionsOpen(false)
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
              >
                {isHardStopEnabled ? 'Disable hard stop' : 'Enable hard stop'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isSkillsEnabled) {
                    onUpdateData('requiredSkills', [])
                    setIsSkillsEnabled(false)
                    setIsOptionsOpen(false)
                    return
                  }
                  setIsSkillsEnabled(true)
                  onUpdateData('requiredSkills', data.requiredSkills ?? [])
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
              >
                {isSkillsEnabled ? 'Disable required skills' : 'Add required skill'}
              </button>

              {isSkillsEnabled && (
                <div className="px-2 py-1.5 border-b">
                  <SkillChipsInput
                    value={requiredSkills}
                    suggestions={skillsForPicker}
                    onChange={(skills) => onUpdateData('requiredSkills', skills)}
                    placeholder="Required skill..."
                    inputClassName="text-[10px]"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsOptionsOpen(false)
                  onDeleteNode()
                }}
                className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded"
              >
                Delete node
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center -mt-1">
        <select
          value={data.priority || 'medium'}
          onChange={(e) => onUpdateData('priority', e.target.value as Priority)}
          className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none appearance-none text-center ${PRIORITY_COLORS[data.priority || 'medium']}`}
        >
          {priorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        className="w-full border-b pb-1 text-center font-bold text-sm focus:outline-none focus:ring-0 bg-white"
        defaultValue={data.label}
        onChange={(e) => onUpdateData('label', e.target.value)}
      />

      <div className="flex flex-col gap-2 text-[10px] text-gray-500 pt-0.5">
        <div className="flex justify-between items-center gap-2 border rounded px-2 py-1 bg-slate-50">
          <span className="whitespace-nowrap font-semibold text-[9px] uppercase tracking-wide">Estimate</span>
          <input
            type="number"
            className="w-20 border rounded px-2 text-right text-lg font-bold leading-none focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-800"
            defaultValue={data.estimate}
            onChange={(e) => onUpdateData('estimate', parseFloat(e.target.value) || 0)}
          />
        </div>

        {isHardStopEnabled && (
          <div className="flex justify-between items-center gap-2">
            <span className="whitespace-nowrap font-semibold">Hard Stop:</span>
            <input
              type="number"
              placeholder="No limit"
              className="w-20 border rounded px-1.5 text-right text-xs focus:ring-1 focus:ring-red-500 outline-none placeholder:text-gray-300 bg-white"
              value={data.limit ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                onUpdateData('limit', isNaN(val) ? undefined : val)
              }}
            />
          </div>
        )}

        {(data.requiredSkills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {requiredSkills.map((skill) => (
              <span key={skill} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${skillColorClass(skill)}`}>
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] uppercase tracking-wide font-semibold text-gray-400">Risk</span>
          <select
            value={data.risk || 'medium'}
            onChange={(e) => onUpdateData('risk', e.target.value as ProjectStats.RiskLevel)}
            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none appearance-none text-center ${RISK_COLORS[data.risk || 'medium']}`}
          >
            {riskLevels.map((risk) => (
              <option key={risk} value={risk}>
                {risk}
              </option>
            ))}
          </select>
        </div>
      </div>

      {totals && (
        <div className="mt-1 border-t pt-2 flex flex-col gap-1 bg-blue-50/50 -mx-2.5 px-2.5 pb-1.5">
          <div className="flex justify-between items-center font-bold text-xs text-blue-700">
            <span>Median (P50):</span>
            <span>{totals.p50.toFixed(1)}</span>
          </div>

          {totals.successProb < 0.9999 && (
            <div
              className={`flex justify-between items-center text-[10px] font-bold px-1 py-0.5 rounded ${totals.successProb < 0.9 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              <span>SUCCESS CHANCE:</span>
              <span>{(totals.successProb * 100).toFixed(1)}%</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-1 text-[9px] text-blue-500 text-center border-t border-blue-100 pt-1">
            <div title="80% Confidence Level" className="flex flex-col">
              <span className="opacity-60">80%</span>
              <span className="font-semibold">{totals.p80.toFixed(1)}</span>
            </div>
            <div title="95% Confidence Level" className="flex flex-col border-x border-blue-100/50">
              <span className="opacity-60">95%</span>
              <span className="font-semibold">{totals.p95.toFixed(1)}</span>
            </div>
            <div title="99% Confidence Level" className="flex flex-col">
              <span className="opacity-60">99%</span>
              <span className="font-semibold">{totals.p99.toFixed(1)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-[9px] text-blue-400 border-t border-blue-100 pt-1 italic">
            <span>Expected Avg:</span>
            <span>{totals.ev.toFixed(1)}</span>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NA'
  const first = parts[0] ?? ''
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const second = parts[1] ?? ''
  return `${first.slice(0, 1)}${second.slice(0, 1)}`.toUpperCase()
}
