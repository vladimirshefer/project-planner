import {useEffect, useState} from 'react'
import {Handle, Position} from '@xyflow/react'
import {EstimationsGraph} from '../../utils/estimations-graph'
import {ProjectStats} from '../../utils/project-stats'
import {skillColorClass, uniqueSkills} from '../../utils/skills'
import {EstimateInputRow} from "./EstimateInputRow";
import {EstimateSummary} from "./EstimateSummary";
import {NodeOptionsMenu} from "./NodeOptionsMenu";
import {AssigneeMenu} from "./AssigneeMenu";

export const PRIORITY_COLORS: Record<EstimationsGraph.Priority, string> = {
  minor: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-blue-50 text-blue-600 border-blue-200',
  major: 'bg-orange-50 text-orange-600 border-orange-200',
  critical: 'bg-red-50 text-red-600 border-red-200',
}

export const RISK_COLORS: Record<ProjectStats.RiskLevel, string> = {
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
  data: EstimationsGraph.NodeData
  workers: EstimationsGraph.WorkerDto[]
  skillSuggestions: string[]
  priorities: EstimationsGraph.Priority[]
  riskLevels: ProjectStats.RiskLevel[]
  totals: ProjectStats.ViewMarks | null
  onUpdateData: (key: keyof EstimationsGraph.NodeData, value: any) => void
  onDeleteNode: () => void
}) {
  const [isHardStopEnabled, setIsHardStopEnabled] = useState(data.limit !== undefined && data.limit !== null)
  const [isSkillsEnabled, setIsSkillsEnabled] = useState((data.requiredSkills?.length ?? 0) > 0)
  const [isEditingEstimate, setIsEditingEstimate] = useState(false)
  const [draftEstimate, setDraftEstimate] = useState('')

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

  const startEstimateEditing = () => {
    setDraftEstimate('')
    setIsEditingEstimate(true)
  }

  const updateAssigneeSelection = (workerId: string, checked: boolean) => {
    const next = checked ? [...assigneeIds, workerId] : assigneeIds.filter((id) => id !== workerId)
    onUpdateData('assigneeIds', Array.from(new Set(next)))
  }

  const toggleHardStop = () => {
    if (isHardStopEnabled) {
      onUpdateData('limit', undefined)
      setIsHardStopEnabled(false)
    } else {
      setIsHardStopEnabled(true)
    }
  }

  const toggleSkillsEnabled = () => {
    if (isSkillsEnabled) {
      onUpdateData('requiredSkills', [])
      setIsSkillsEnabled(false)
      return
    }

    setIsSkillsEnabled(true)
    onUpdateData('requiredSkills', data.requiredSkills ?? [])
  }

  return (
    <div className="rounded border bg-white p-2.5 shadow-md min-w-[180px] flex flex-col gap-2">
      <Handle type="target" position={Position.Top} />

      <div className="flex items-center justify-between -mb-1">
        <AssigneeMenu
          initials={primaryInitials}
          workers={workers}
          assigneeIds={assigneeIds}
          onChangeSelection={updateAssigneeSelection}
        />

        <NodeOptionsMenu
          isHardStopEnabled={isHardStopEnabled}
          isSkillsEnabled={isSkillsEnabled}
          requiredSkills={requiredSkills}
          skillsForPicker={skillsForPicker}
          onToggleHardStop={toggleHardStop}
          onToggleSkills={toggleSkillsEnabled}
          onChangeSkills={(skills) => onUpdateData('requiredSkills', skills)}
          onDeleteNode={onDeleteNode}
        />
      </div>

      <div className="flex justify-center -mt-1">
        <select
          value={data.priority || 'medium'}
          onChange={(e) => onUpdateData('priority', e.target.value as EstimationsGraph.Priority)}
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
          <EstimateSummary
            totals={totals}
          />
        )}

        {!estimateIsSet && !isEditingEstimate && (
          <div className="flex justify-end">
            <button
              type="button"
              title="Click to add estimate"
              className="text-[10px] text-gray-500 underline decoration-dotted underline-offset-2 hover:text-gray-700"
              onClick={startEstimateEditing}
            >
              No estimate
            </button>
          </div>
        )}

        {(estimateIsSet || isEditingEstimate) && (
          <EstimateInputRow
            isEditing={isEditingEstimate}
            value={isEditingEstimate ? draftEstimate : formatEstimateInput(data.estimate)}
            onFocus={() => setIsEditingEstimate(true)}
            onChange={setDraftEstimate}
            onCommit={commitEstimate}
            onCancel={cancelEstimate}
          />
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
          <RiskSelector
            riskLevels={riskLevels}
            value={data.risk || 'none'}
            onChange={(risk) => onUpdateData('risk', risk)}
          />
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

function RiskSelector({
  riskLevels,
  value,
  onChange,
}: {
  riskLevels: ProjectStats.RiskLevel[]
  value: ProjectStats.RiskLevel
  onChange: (risk: ProjectStats.RiskLevel) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[9px] uppercase tracking-wide font-semibold text-gray-400">Risk</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProjectStats.RiskLevel)}
        className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border cursor-pointer outline-none appearance-none text-center ${RISK_COLORS[value]}`}
      >
        {riskLevels.map((risk) => (
          <option key={risk} value={risk}>
            {risk}
          </option>
        ))}
      </select>
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
