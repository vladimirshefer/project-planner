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
  none: 'bg-slate-100 text-slate-600 border-slate-200',
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
  totals: ProjectStats.ViewMarks | null
  onUpdateData: (key: keyof NodeData, value: any) => void
  onDeleteNode: () => void
}) {
  const [isHardStopEnabled, setIsHardStopEnabled] = useState(data.limit !== undefined && data.limit !== null)
  const [isSkillsEnabled, setIsSkillsEnabled] = useState((data.requiredSkills?.length ?? 0) > 0)
  const [isAssigneeOpen, setIsAssigneeOpen] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isEstimateInfoOpen, setIsEstimateInfoOpen] = useState(false)
  const [isEditingEstimate, setIsEditingEstimate] = useState(false)
  const [draftEstimate, setDraftEstimate] = useState('')
  const assigneeMenuRef = useRef<HTMLDivElement | null>(null)
  const optionsMenuRef = useRef<HTMLDivElement | null>(null)
  const estimateInfoRef = useRef<HTMLDivElement | null>(null)
  const estimateInputRef = useRef<HTMLInputElement | null>(null)

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
    if (isEditingEstimate) {
      setDraftEstimate(formatEstimateInput(data.estimate))
      return
    }
    if (!hasEstimate(data.estimate)) {
      setDraftEstimate('')
    }
  }, [data.estimate, isEditingEstimate])

  useEffect(() => {
    if (!isEditingEstimate) return
    estimateInputRef.current?.focus()
    estimateInputRef.current?.select()
  }, [isEditingEstimate])

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
      if (isEstimateInfoOpen && estimateInfoRef.current && !estimateInfoRef.current.contains(target)) {
        setIsEstimateInfoOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsAssigneeOpen(false)
      setIsOptionsOpen(false)
      setIsEstimateInfoOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isAssigneeOpen, isEstimateInfoOpen, isOptionsOpen])

  const assigneeIds = data.assigneeIds ?? []
  const assignees = workers.filter((worker) => assigneeIds.includes(worker.id))
  const primaryAssignee = assignees[0]
  const primaryInitials = getInitials(primaryAssignee?.name ?? 'Unassigned')
  const requiredSkills = data.requiredSkills ?? []
  const skillsForPicker = uniqueSkills([...(skillSuggestions ?? []), ...requiredSkills])
  const estimateIsSet = hasEstimate(data.estimate)

  const commitEstimate = () => {
    const parsed = parseFloat(draftEstimate)
    onUpdateData('estimate', Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
    setIsEditingEstimate(false)
  }

  const cancelEstimate = () => {
    setDraftEstimate(formatEstimateInput(data.estimate))
    setIsEditingEstimate(false)
  }

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
        {totals && (
          <div className="relative rounded-md border border-blue-100 px-2 py-2 shadow-sm" ref={estimateInfoRef}>
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex min-w-0 flex-1 items-end justify-between gap-2"
                aria-label="Estimate summary"
              >
                <div
                  title="Optimistic estimate - P30 - 30% chance"
                  className="flex min-w-0 flex-col items-start text-emerald-700"
                >
                  <span className="text-[8px] font-semibold uppercase tracking-wide text-emerald-600/80">Opt</span>
                  <span className="text-sm font-semibold leading-none">{totals.p30.toFixed(1)}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-center text-center text-sky-900">
                  <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-sky-600">Expected avg</span>
                  <span className="text-[28px] font-black leading-none tracking-tight">{totals.ev.toFixed(1)}</span>
                </div>
                <div
                  title="Worst-case estimate - P95 - 95% confidence"
                  className="flex min-w-0 flex-col items-end text-orange-700"
                >
                  <span className="text-[8px] font-semibold uppercase tracking-wide text-orange-600/80">Worst</span>
                  <span className="text-sm font-semibold leading-none">{totals.p95.toFixed(1)}</span>
                </div>
              </div>

              <button
                type="button"
                aria-expanded={isEstimateInfoOpen}
                aria-label="Show estimate details"
                onClick={() => setIsEstimateInfoOpen((open) => !open)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-[10px] font-bold text-blue-700 shadow-sm hover:bg-blue-50"
              >
                i
              </button>
            </div>

            {isEstimateInfoOpen && (
              <div className="absolute right-0 top-full z-20 mt-1 w-40 md border border-blue-100 bg-white p-2 shadow-lg">
                <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-blue-500">Estimate breakdown</div>
                <div className="space-y-1 text-[10px] text-slate-600">
                  <div className="flex items-center justify-between gap-2">
                    <span>Expected avg</span>
                    <span className="font-semibold text-sky-800">{totals.ev.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Optimistic (P30)</span>
                    <span className="font-semibold text-emerald-700">{totals.p30.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>P50</span>
                    <span className="font-semibold text-slate-800">{totals.p50.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>P80</span>
                    <span className="font-semibold text-slate-800">{totals.p80.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Worst (P95)</span>
                    <span className="font-semibold text-orange-700">{totals.p95.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>P99</span>
                    <span className="font-semibold text-slate-800">{totals.p99.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!estimateIsSet && !isEditingEstimate && (
          <div className="flex justify-end">
            <button
              type="button"
              title="Click to add estimate"
              className="text-[10px] text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700"
              onClick={() => {
                setDraftEstimate('')
                setIsEditingEstimate(true)
              }}
            >
              No estimate
            </button>
          </div>
        )}

        {(estimateIsSet || isEditingEstimate) && (
          <div className="flex justify-between items-center gap-2 rounded border border-slate-200 px-2 py-1 bg-slate-50/70">
            <span className="whitespace-nowrap font-medium text-[9px] uppercase tracking-wide text-slate-500">Base estimate</span>
            <div className="w-20 min-h-[26px] flex items-center justify-end">
              <input
                ref={estimateInputRef}
                type="number"
                value={isEditingEstimate ? draftEstimate : formatEstimateInput(data.estimate)}
                className="w-20 border rounded px-2 text-right text-sm font-semibold leading-none focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-700"
                onFocus={() => setIsEditingEstimate(true)}
                onChange={(e) => setDraftEstimate(e.target.value)}
                onBlur={commitEstimate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitEstimate()
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault()
                    cancelEstimate()
                  }
                }}
              />
            </div>
          </div>
        )}

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

        {estimateIsSet && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-[9px] uppercase tracking-wide font-semibold text-gray-400">Risk</span>
            <select
              value={data.risk || 'none'}
              onChange={(e) => onUpdateData('risk', e.target.value as ProjectStats.RiskLevel)}
              className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none appearance-none text-center ${RISK_COLORS[data.risk || 'none']}`}
            >
              {riskLevels.map((risk) => (
                <option key={risk} value={risk}>
                  {risk}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totals && totals.successProb < 0.9999 && (
        <div className="mt-1 border-t pt-2 flex flex-col gap-1 bg-blue-50/50 -mx-2.5 px-2.5 pb-1.5">
          <div
            className={`flex justify-between items-center text-[10px] font-bold px-1 py-0.5 rounded ${totals.successProb < 0.9 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          >
            <span>SUCCESS CHANCE:</span>
            <span>{(totals.successProb * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}

function hasEstimate(estimate: number | undefined): boolean {
  return typeof estimate === 'number' && Number.isFinite(estimate) && estimate > 0
}

function formatEstimateInput(estimate: number | undefined): string {
  return hasEstimate(estimate) ? String(estimate) : ''
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NA'
  const first = parts[0] ?? ''
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const second = parts[1] ?? ''
  return `${first.slice(0, 1)}${second.slice(0, 1)}`.toUpperCase()
}
