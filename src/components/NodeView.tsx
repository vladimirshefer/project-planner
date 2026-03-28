import { useEffect, useState } from 'react'
import {Handle, Position} from '@xyflow/react'
import {EstimationsGraph} from '../utils/estimations-graph'
import {ProjectStats} from '../utils/project-stats'

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
  priorities,
  riskLevels,
  totals,
  onUpdateData,
  onDeleteNode,
}: {
  data: NodeData
  priorities: Priority[]
  riskLevels: ProjectStats.RiskLevel[]
  totals: ReturnType<typeof ProjectStats.extractViewMarks> | null
  onUpdateData: (key: keyof NodeData, value: any) => void
  onDeleteNode: () => void
}) {
  const [isHardStopEnabled, setIsHardStopEnabled] = useState(data.limit !== undefined && data.limit !== null)

  useEffect(() => {
    if (data.limit !== undefined && data.limit !== null) {
      setIsHardStopEnabled(true)
    }
  }, [data.limit])

  return (
    <div className="rounded border bg-white p-2.5 shadow-md min-w-[180px] flex flex-col gap-2">
      <Handle type="target" position={Position.Top} />

      <div className="flex justify-end -mb-1">
        <details className="relative">
          <summary className="list-none cursor-pointer select-none text-xs text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-100">
            ...
          </summary>
          <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-10 min-w-[110px]">
            <button
              type="button"
              onClick={() => {
                if (isHardStopEnabled) {
                  onUpdateData('limit', undefined)
                  setIsHardStopEnabled(false)
                  return
                }
                setIsHardStopEnabled(true)
              }}
              className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
            >
              {isHardStopEnabled ? 'Disable hard stop' : 'Enable hard stop'}
            </button>
            <button
              type="button"
              onClick={onDeleteNode}
              className="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
            >
              Delete node
            </button>
          </div>
        </details>
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
