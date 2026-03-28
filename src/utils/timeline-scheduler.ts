import { EstimationsGraph } from './estimations-graph'

export namespace TimelineScheduler {
  export type Lane = {
    id: string
    label: string
    kind: 'worker' | 'virtual'
  }

  export type Task = {
    nodeId: string
    nodeLabel: string
    laneId: string
    start: number
    end: number
    reason?: string
  }

  export type Result = {
    lanes: Lane[]
    tasks: Task[]
    totalDuration: number
  }

  type LaneState = {
    lane: Lane
    freeAt: number
  }

  export function build(state: EstimationsGraph.GraphState): Result {
    const nodes = state.nodes
    const edges = state.edges
    const workers = state.workers ?? []

    const nodeById = new Map(nodes.map((node) => [node.id, node]))
    const deps = new Map<string, string[]>()

    nodes.forEach((node) => deps.set(node.id, []))
    edges.forEach((edge) => {
      if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return
      const current = deps.get(edge.source)
      if (!current) return
      current.push(edge.target)
    })

    const workerLanes = new Map<string, LaneState>()
    workers.forEach((worker) => {
      workerLanes.set(worker.id, {
        lane: { id: `worker:${worker.id}`, label: worker.name, kind: 'worker' },
        freeAt: 0,
      })
    })

    const virtualLanes = new Map<string, LaneState>()
    const getVirtualLane = (reason: string): LaneState => {
      const laneId = `virtual:${reason}`
      const existing = virtualLanes.get(laneId)
      if (existing) return existing
      const created: LaneState = {
        lane: { id: laneId, label: `Missing worker ${reason}`, kind: 'virtual' },
        freeAt: 0,
      }
      virtualLanes.set(laneId, created)
      return created
    }

    const memo = new Map<string, Task>()
    const visiting = new Set<string>()

    const pickLane = (node: EstimationsGraph.GraphNode, earliestStart: number): { lane: LaneState; reason?: string } => {
      const assigneeIds = node.data.assigneeIds ?? []
      const requiredSkills = (node.data.requiredSkills ?? []).map(normalizeSkill).filter(Boolean)

      let candidates: LaneState[] = []
      let missReason: string | undefined

      if (assigneeIds.length > 0) {
        candidates = assigneeIds
          .map((id) => workerLanes.get(id))
          .filter((lane): lane is LaneState => Boolean(lane))
        if (candidates.length === 0) missReason = 'assignee'
      } else if (requiredSkills.length > 0) {
        candidates = workers
          .filter((worker) => worker.skills.some((skill) => requiredSkills.includes(normalizeSkill(skill))))
          .map((worker) => workerLanes.get(worker.id))
          .filter((lane): lane is LaneState => Boolean(lane))
        if (candidates.length === 0) missReason = requiredSkills[0]
      } else {
        candidates = Array.from(workerLanes.values())
        if (candidates.length === 0) missReason = 'unassigned'
      }

      if (candidates.length === 0) {
        return { lane: getVirtualLane(missReason ?? 'unknown'), reason: missReason }
      }

      const firstCandidate = candidates[0]
      if (!firstCandidate) {
        return { lane: getVirtualLane(missReason ?? 'unknown'), reason: missReason }
      }

      const chosen = candidates.slice(1).reduce((best, current) => {
        const bestStart = Math.max(earliestStart, best.freeAt)
        const currentStart = Math.max(earliestStart, current.freeAt)
        if (currentStart < bestStart) return current
        if (currentStart > bestStart) return best
        return current.lane.label.localeCompare(best.lane.label) < 0 ? current : best
      }, firstCandidate)

      return { lane: chosen }
    }

    const scheduleNode = (nodeId: string): Task => {
      const existing = memo.get(nodeId)
      if (existing) return existing

      if (visiting.has(nodeId)) {
        const cyc = nodeById.get(nodeId)
        const cycleTask: Task = {
          nodeId,
          nodeLabel: cyc?.data.label ?? nodeId,
          laneId: getVirtualLane('cycle').lane.id,
          start: 0,
          end: Math.max(0, cyc?.data.estimate ?? 0),
          reason: 'cycle',
        }
        memo.set(nodeId, cycleTask)
        return cycleTask
      }

      visiting.add(nodeId)
      const node = nodeById.get(nodeId)
      if (!node) {
        const missTask: Task = { nodeId, nodeLabel: nodeId, laneId: getVirtualLane('unknown').lane.id, start: 0, end: 0, reason: 'unknown' }
        memo.set(nodeId, missTask)
        visiting.delete(nodeId)
        return missTask
      }

      const depIds = deps.get(nodeId) ?? []
      let depsEnd = 0
      depIds.forEach((depId) => {
        const depTask = scheduleNode(depId)
        if (depTask.end > depsEnd) depsEnd = depTask.end
      })

      const duration = Math.max(0, node.data.estimate ?? 0)
      const laneSelection = pickLane(node, depsEnd)
      const start = Math.max(depsEnd, laneSelection.lane.freeAt)
      const end = start + duration
      laneSelection.lane.freeAt = end

      const task: Task = {
        nodeId: node.id,
        nodeLabel: node.data.label,
        laneId: laneSelection.lane.lane.id,
        start,
        end,
        reason: laneSelection.reason,
      }

      memo.set(nodeId, task)
      visiting.delete(nodeId)
      return task
    }

    const orderedNodeIds = [...nodes].sort((a, b) => a.id.localeCompare(b.id)).map((node) => node.id)
    orderedNodeIds.forEach(scheduleNode)

    const tasks = Array.from(memo.values())
    const lanes = [
      ...Array.from(workerLanes.values()).map((s) => s.lane),
      ...Array.from(virtualLanes.values()).map((s) => s.lane),
    ]
    const totalDuration = tasks.reduce((max, task) => Math.max(max, task.end), 0)

    return { lanes, tasks, totalDuration }
  }

  function normalizeSkill(skill: string): string {
    return skill.trim().toLowerCase()
  }
}
