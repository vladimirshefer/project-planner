import { useMemo } from 'react'
import { EstimationsGraph } from '../utils/estimations-graph'
import { TimelineScheduler } from '../utils/timeline-scheduler'

export function TimelineView({
  state,
  onTaskClick,
}: {
  state: EstimationsGraph.GraphState
  onTaskClick?: (nodeId: string) => void
}) {
  const timeline = useMemo(() => TimelineScheduler.build(state), [state])
  const pxPerUnit = 32
  const canvasWidth = Math.max(900, Math.ceil(timeline.totalDuration * pxPerUnit) + 140)

  return (
    <div className="bg-white border rounded p-4 overflow-auto">
      {timeline.lanes.length === 0 && (
        <p className="text-sm text-gray-500">No workers. Add workers to generate a timeline.</p>
      )}

      <div className="min-w-[900px]" style={{ width: `${canvasWidth}px` }}>
        {timeline.lanes.map((lane) => {
          const tasks = timeline.tasks
            .filter((task) => task.laneId === lane.id)
            .sort((a, b) => a.start - b.start)
          const blockers = timeline.blockers
            .filter((blocker) => blocker.laneId === lane.id)
            .sort((a, b) => a.start - b.start)

          return (
            <div key={lane.id} className="border-b last:border-b-0 py-3">
              <div className="w-44 shrink-0 text-sm font-semibold text-gray-700 mb-2">
                {lane.label}
              </div>
              <div className="relative h-12 rounded bg-slate-50 border">
                {blockers.map((blocker, idx) => {
                  const left = blocker.start * pxPerUnit
                  const width = Math.max(8, (blocker.end - blocker.start) * pxPerUnit)
                  return (
                    <div
                      key={`${lane.id}-blocker-${idx}`}
                      className="absolute top-1.5 h-9 rounded border border-slate-300 bg-slate-200/90"
                      style={{ left: `${left}px`, width: `${width}px` }}
                      title="Unavailable"
                    />
                  )
                })}
                {tasks.map((task) => {
                  const left = task.start * pxPerUnit
                  const width = Math.max(8, (task.end - task.start) * pxPerUnit)
                  return (
                    <button
                      type="button"
                      key={task.nodeId}
                      className={`absolute top-1.5 h-9 rounded px-2 py-1 text-[10px] font-semibold overflow-hidden ${lane.kind === 'virtual' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      title={`${task.nodeLabel} (${task.start} -> ${task.end})${task.reason ? `, ${task.reason}` : ''}`}
                      onClick={() => onTaskClick?.(task.nodeId)}
                    >
                      <div className="truncate">{task.nodeLabel}</div>
                      <div className="text-[9px] opacity-70">{task.start} - {task.end}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
