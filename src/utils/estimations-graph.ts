import { Edge, MarkerType, Node } from '@xyflow/react'
import { StatsEngine } from './stats-engine'
import { ProjectStats } from './project-stats'

export namespace EstimationsGraph {
  export const STORAGE_KEY = 'planning-assistant-graph-v1'
  export const PROJECTS_STORAGE_KEY = 'planning-assistant-projects-v1'

  export type Priority = 'minor' | 'medium' | 'major' | 'critical'

  export type NodeData = {
    label: string
    estimate: number
    risk: ProjectStats.RiskLevel
    priority: Priority
    limit?: number
    histogram?: StatsEngine.Distribution
    successProb?: number
  }

  export type EdgeData = {
    probability?: number
    recovery?: number
  }

  export type GraphNode = Node<NodeData>
  export type GraphEdge = Edge<EdgeData>

  export type GraphState = {
    nodes: GraphNode[]
    edges: GraphEdge[]
  }

  export type SavedProject = {
    id: string
    name: string
    updatedAt: string
    tickets: string[]
    state: GraphState
  }

  export function createInitialState(): GraphState {
    return {
      nodes: [
        {
          id: '1',
          position: { x: 0, y: 50 },
          data: { label: 'Total Project', estimate: 0, risk: 'low', priority: 'medium' },
          type: 'editable',
        },
        {
          id: '2',
          position: { x: 300, y: 0 },
          data: { label: 'Feature A', estimate: 5, risk: 'medium', priority: 'medium' },
          type: 'editable',
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
          type: 'editable',
          data: { probability: 100 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
      ],
    }
  }

  export function serialize(state: GraphState): string {
    return JSON.stringify(state, null, 2)
  }

  export function deserialize(raw: string): GraphState {
    const parsed = JSON.parse(raw) as Partial<GraphState>
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('JSON must contain "nodes" and "edges" arrays.')
    }

    return {
      nodes: parsed.nodes as GraphNode[],
      edges: parsed.edges as GraphEdge[],
    }
  }

  export function loadFromStorage(storage: Storage = localStorage): GraphState {
    const fallback = createInitialState()
    const saved = storage.getItem(STORAGE_KEY)
    if (!saved) return fallback

    try {
      return deserialize(saved)
    } catch (e) {
      console.error('Failed to parse saved graph', e)
      return fallback
    }
  }

  export function saveToStorage(state: GraphState, storage: Storage = localStorage): void {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  export function clearStorage(storage: Storage = localStorage): void {
    storage.removeItem(STORAGE_KEY)
  }

  export function listProjects(storage: Storage = localStorage): SavedProject[] {
    const raw = storage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as SavedProject[]
      if (!Array.isArray(parsed)) return []
      return parsed
    } catch {
      return []
    }
  }

  export function getProjectById(id: string, storage: Storage = localStorage): SavedProject | null {
    const projects = listProjects(storage)
    return projects.find((project) => project.id === id) ?? null
  }

  export function saveProject(
    input: { id?: string; name: string; state: GraphState },
    storage: Storage = localStorage
  ): SavedProject {
    const projects = listProjects(storage)
    const projectId = input.id ?? `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    const now = new Date().toISOString()
    const tickets = extractTickets(input.state)

    const saved: SavedProject = {
      id: projectId,
      name: input.name.trim(),
      updatedAt: now,
      tickets,
      state: input.state,
    }

    const existingIndex = projects.findIndex((project) => project.id === projectId)
    if (existingIndex >= 0) {
      projects[existingIndex] = saved
    } else {
      projects.unshift(saved)
    }

    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
    return saved
  }

  function extractTickets(state: GraphState): string[] {
    const unique = new Set<string>()
    state.nodes.forEach((node) => {
      const label = node.data?.label?.trim()
      if (label) unique.add(label)
    })
    return Array.from(unique)
  }
}
