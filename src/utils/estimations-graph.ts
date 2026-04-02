import { Edge, MarkerType, Node } from '@xyflow/react'
import { parse, stringify } from 'yaml'
import { StatsEngine } from './stats-engine'
import { ProjectStats } from './project-stats'

export namespace EstimationsGraph {
  export const STORAGE_KEY = 'planning-assistant-graph-v1'
  export const PROJECTS_STORAGE_KEY = 'planning-assistant-projects-v1'

  export type Priority = 'minor' | 'medium' | 'major' | 'critical'

  export type NodeData = {
    label: string
    estimate: number
    risk?: ProjectStats.RiskLevel
    priority: Priority
    limit?: number
    assigneeIds?: string[]
    requiredSkills?: string[]
    histogram?: StatsEngine.Distribution
    successProb?: number
  }

  export type WorkerDto = {
    id: string
    name: string
    skills: string[]
    availabilityPercent: number
  }

  export type RelationKind = 'contains' | 'after'

  export type EdgeData = {
    kind?: RelationKind
    probability?: number
    recovery?: number
  }

  export type GraphNode = Node<NodeData>
  export type GraphEdge = Edge<EdgeData>

  export type GraphState = {
    nodes: GraphNode[]
    edges: GraphEdge[]
    workers: WorkerDto[]
  }

  export type SavedProject = {
    id: string
    name: string
    updatedAt: string
    tickets: string[]
    state: GraphState
  }

  export type ImportReport = {
    importedItems: number
    importedWorkers: number
    importedRelations: number
    skippedRelations: number
    normalizedValues: number
    renamedItems: number
    warnings: string[]
  }

  export type TextImportResult = {
    state: GraphState
    report: ImportReport
  }

  export function createInitialState(): GraphState {
    return {
      nodes: [
        {
          id: '1',
          position: { x: 0, y: 50 },
          data: { label: 'Total Project', estimate: 0, risk: 'none', priority: 'medium' },
          type: 'editable',
        },
        {
          id: '2',
          position: { x: 300, y: 0 },
          data: { label: 'Feature A', estimate: 5, risk: 'none', priority: 'medium' },
          type: 'editable',
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: '1',
          target: '2',
          type: 'editable',
          data: { kind: 'contains', probability: 100 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
      ],
      workers: [],
    }
  }

  export function createProjectId(): string {
    return `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`
  }

  export function serialize(state: GraphState): string {
    return serializeText(state)
  }

  export function deserialize(raw: string): GraphState {
    const parsed = JSON.parse(raw) as Partial<GraphState>
    if (!parsed || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      throw new Error('JSON must contain "nodes" and "edges" arrays.')
    }

    return normalizeState(parsed)
  }

  export function serializeText(state: GraphState): string {
    const normalized = normalizeState(state)
    const nodeById = new Map(normalized.nodes.map((node) => [node.id, node]))
    const containsEdges = normalized.edges.filter((edge) => normalizeEdgeKind(edge.data?.kind) === 'contains')
    const afterEdges = normalized.edges.filter((edge) => normalizeEdgeKind(edge.data?.kind) === 'after')

    const containsBySource = new Map<string, GraphEdge[]>()
    const incomingContainsCount = new Map<string, number>()
    normalized.nodes.forEach((node) => incomingContainsCount.set(node.id, 0))
    containsEdges.forEach((edge) => {
      if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return
      const current = containsBySource.get(edge.source) ?? []
      current.push(edge)
      containsBySource.set(edge.source, current)
      incomingContainsCount.set(edge.target, (incomingContainsCount.get(edge.target) ?? 0) + 1)
    })

    const afterBySource = new Map<string, GraphEdge[]>()
    afterEdges.forEach((edge) => {
      if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return
      const current = afterBySource.get(edge.source) ?? []
      current.push(edge)
      afterBySource.set(edge.source, current)
    })

    const nameCounts = new Map<string, number>()
    normalized.nodes.forEach((node) => {
      const key = normalizeKey(node.data.label)
      nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
    })

    const canInlineEdge = (edge: GraphEdge): boolean => {
      if (normalizeEdgeKind(edge.data?.kind) !== 'contains') return false
      const prob = normalizeProbability(edge.data?.probability)
      const recovery = normalizeRecovery(edge.data?.recovery)
      if (prob !== 100 || recovery !== 0) return false
      return (incomingContainsCount.get(edge.target) ?? 0) === 1
    }

    const mustHaveId = new Set<string>()
    normalized.nodes.forEach((node) => {
      if ((nameCounts.get(normalizeKey(node.data.label)) ?? 0) > 1) mustHaveId.add(node.id)
    })
    containsEdges.forEach((edge) => {
      if (!canInlineEdge(edge)) {
        mustHaveId.add(edge.target)
      }
    })
    afterEdges.forEach((edge) => {
      mustHaveId.add(edge.target)
    })

    const refFor = (targetId: string): string => {
      const node = nodeById.get(targetId)
      if (!node) return targetId
      if (mustHaveId.has(targetId)) return targetId
      return node.data.label
    }

    const emitted = new Set<string>()
    const roots = [...normalized.nodes]
      .filter((node) => (incomingContainsCount.get(node.id) ?? 0) === 0)
      .sort((a, b) => a.id.localeCompare(b.id))

    const encodeContainsRef = (edge: GraphEdge): string | { ref: string; probability?: number; recovery?: number } => {
      const ref = refFor(edge.target)
      const prob = normalizeProbability(edge.data?.probability)
      const recovery = normalizeRecovery(edge.data?.recovery)
      if (prob === 100 && recovery === 0) return ref
      return {
        ref,
        probability: prob !== 100 ? prob : undefined,
        recovery: recovery !== 0 ? recovery : undefined,
      }
    }

    const toItem = (nodeId: string): Record<string, unknown> | null => {
      const node = nodeById.get(nodeId)
      if (!node) return null
      emitted.add(nodeId)

      const item: Record<string, unknown> = {
        name: node.data.label,
      }

      if (mustHaveId.has(nodeId)) item.id = node.id
      if ((node.data.estimate ?? 0) > 0) item.estimate = node.data.estimate
      if (normalizeRisk(node.data.risk) !== 'none') item.risk = normalizeRisk(node.data.risk)
      if (normalizePriority(node.data.priority) !== 'medium') item.priority = normalizePriority(node.data.priority)
      if (typeof node.data.limit === 'number' && Number.isFinite(node.data.limit)) item.limit = node.data.limit

      const assignee = encodeAssignee(node.data)
      if (assignee) item.assignee = assignee

      const contains = containsBySource.get(nodeId) ?? []
      const inlineItems: Record<string, unknown>[] = []
      const containsRefs: Array<string | { ref: string; probability?: number; recovery?: number }> = []
      contains
        .sort((a, b) => a.target.localeCompare(b.target))
        .forEach((edge) => {
          if (canInlineEdge(edge) && !emitted.has(edge.target)) {
            const childItem = toItem(edge.target)
            if (childItem) inlineItems.push(childItem)
            return
          }
          containsRefs.push(encodeContainsRef(edge))
        })

      if (inlineItems.length > 0) item.contains = inlineItems
      if (containsRefs.length > 0) item.contains_id = containsRefs

      const afterRefs = (afterBySource.get(nodeId) ?? [])
        .sort((a, b) => a.target.localeCompare(b.target))
        .map((edge) => refFor(edge.target))
      if (afterRefs.length > 0) item.after = afterRefs

      return item
    }

    const items: Record<string, unknown>[] = []
    roots.forEach((root) => {
      if (emitted.has(root.id)) return
      const built = toItem(root.id)
      if (built) items.push(built)
    })
    normalized.nodes
      .sort((a, b) => a.id.localeCompare(b.id))
      .forEach((node) => {
        if (emitted.has(node.id)) return
        const built = toItem(node.id)
        if (built) items.push(built)
      })

    const workers = normalized.workers
      .map((worker) => {
        const record: Record<string, unknown> = {
          name: worker.name,
        }
        if (normalizeKey(worker.id) !== normalizeKey(worker.name)) record.id = worker.id
        if (worker.skills.length > 0) record.skills = worker.skills
        if (worker.availabilityPercent !== 100) record.availability = worker.availabilityPercent
        return record
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)))

    return stringify({
      version: 1,
      items,
      ...(workers.length > 0 ? { workers } : {}),
    })
  }

  export function deserializeText(raw: string): TextImportResult {
    const report = createImportReport()
    let parsed: unknown
    try {
      parsed = parse(raw)
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Invalid YAML.')
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('YAML must be an object with "items".')
    }

    const root = parsed as Record<string, unknown>
    if (root.version !== 1) {
      throw new Error('YAML must have "version: 1".')
    }
    if (!Array.isArray(root.items)) {
      throw new Error('YAML must contain an "items" array.')
    }

    const nodes: GraphNode[] = []
    const edges: GraphEdge[] = []
    const workers: WorkerDto[] = []
    const nodeByLowerId = new Map<string, GraphNode>()
    const nodeIdsByLowerName = new Map<string, string[]>()
    const pendingRefs: Array<{ sourceId: string; kind: RelationKind; ref: string; probability?: number; recovery?: number }> = []
    const usedIds = new Set<string>()
    const duplicateCounters = new Map<string, number>()
    const edgeKeys = new Set<string>()

    let nodeIndex = 0
    const nextPosition = () => {
      const x = (nodeIndex % 5) * 280
      const y = Math.floor(nodeIndex / 5) * 180
      nodeIndex += 1
      return { x, y }
    }

    const makeDuplicateName = (baseName: string): string => {
      const key = normalizeKey(baseName)
      const next = (duplicateCounters.get(key) ?? 0) + 1
      duplicateCounters.set(key, next)
      return `${baseName} DUPLICATE ${next}`
    }

    const registerNode = (rawItem: unknown): string | null => {
      if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
        report.warnings.push('Skipped non-object item in "items"/"contains".')
        return null
      }
      const item = rawItem as Record<string, unknown>
      const rawName = typeof item.name === 'string' ? item.name.trim() : ''
      if (!rawName) {
        report.warnings.push('Skipped item without a valid "name".')
        return null
      }

      let name = rawName
      let explicitId = typeof item.id === 'string' ? item.id.trim() : ''
      if (explicitId && usedIds.has(normalizeKey(explicitId))) {
        name = makeDuplicateName(name)
        report.renamedItems += 1
        report.warnings.push(`Duplicate id "${explicitId}" detected. Renamed item to "${name}" and used implicit id.`)
        explicitId = ''
      }

      let id = explicitId || name.trim()
      if (!id) {
        report.warnings.push(`Skipped item "${name}" because id resolution failed.`)
        return null
      }

      while (usedIds.has(normalizeKey(id))) {
        name = makeDuplicateName(name)
        report.renamedItems += 1
        report.warnings.push(`Duplicate item identity detected. Renamed to "${name}".`)
        id = name.trim()
      }

      usedIds.add(normalizeKey(id))

      const estimate = normalizeEstimate(item.estimate, report, `item "${name}"`)
      const risk = normalizeRiskWithReport(item.risk, report, `item "${name}"`)
      const priority = normalizePriorityWithReport(item.priority, report, `item "${name}"`)
      const assignee = normalizeAssignee(item.assignee, report, `item "${name}"`)

      const node: GraphNode = {
        id,
        position: nextPosition(),
        type: 'editable',
        data: {
          label: name,
          estimate,
          risk,
          priority,
          assigneeIds: assignee.assigneeIds,
          requiredSkills: assignee.requiredSkills,
          ...(typeof item.limit === 'number' && Number.isFinite(item.limit) ? { limit: item.limit } : {}),
        },
      }

      nodes.push(node)
      nodeByLowerId.set(normalizeKey(id), node)
      const nameKey = normalizeKey(name)
      const nameIds = nodeIdsByLowerName.get(nameKey) ?? []
      nameIds.push(id)
      nodeIdsByLowerName.set(nameKey, nameIds)
      report.importedItems += 1

      if (Array.isArray(item.contains)) {
        item.contains.forEach((child) => {
          const childId = registerNode(child)
          if (!childId) return
          pushEdge({
            source: id,
            target: childId,
            kind: 'contains',
            probability: 100,
            recovery: 0,
          })
        })
      } else if (item.contains !== undefined) {
        report.warnings.push(`Ignored non-array "contains" for item "${name}".`)
        report.normalizedValues += 1
      }

      if (Array.isArray(item.contains_id)) {
        item.contains_id.forEach((value) => {
          if (typeof value === 'string') {
            pendingRefs.push({ sourceId: id, kind: 'contains', ref: value })
            return
          }
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            const ref = typeof (value as Record<string, unknown>).ref === 'string' ? String((value as Record<string, unknown>).ref) : ''
            if (!ref) {
              report.warnings.push(`Skipped contains_id object without "ref" on item "${name}".`)
              report.skippedRelations += 1
              return
            }
            pendingRefs.push({
              sourceId: id,
              kind: 'contains',
              ref,
              probability: normalizeProbability((value as Record<string, unknown>).probability),
              recovery: normalizeRecovery((value as Record<string, unknown>).recovery),
            })
            return
          }
          report.warnings.push(`Skipped invalid contains_id entry on item "${name}".`)
          report.skippedRelations += 1
        })
      } else if (item.contains_id !== undefined) {
        report.warnings.push(`Ignored non-array "contains_id" for item "${name}".`)
        report.normalizedValues += 1
      }

      if (Array.isArray(item.after)) {
        item.after.forEach((ref) => {
          if (typeof ref !== 'string') {
            report.warnings.push(`Skipped non-string "after" reference on item "${name}".`)
            report.skippedRelations += 1
            return
          }
          pendingRefs.push({ sourceId: id, kind: 'after', ref })
        })
      } else if (item.after !== undefined) {
        report.warnings.push(`Ignored non-array "after" for item "${name}".`)
        report.normalizedValues += 1
      }

      return id
    }

    const pushEdge = (input: {
      source: string
      target: string
      kind: RelationKind
      probability?: number
      recovery?: number
    }) => {
      const key = `${normalizeKey(input.kind)}|${normalizeKey(input.source)}->${normalizeKey(input.target)}`
      if (edgeKeys.has(key)) return
      edgeKeys.add(key)

      const probability = input.kind === 'contains' ? normalizeProbability(input.probability) : undefined
      const recovery = input.kind === 'contains' ? normalizeRecovery(input.recovery) : undefined
      edges.push({
        id: `e-${input.source}-${input.target}-${input.kind}-${edges.length + 1}`,
        source: input.source,
        target: input.target,
        type: 'editable',
        markerEnd: input.kind === 'after' ? { type: MarkerType.Arrow } : { type: MarkerType.ArrowClosed },
        data: {
          kind: input.kind,
          ...(input.kind === 'contains' ? { probability, recovery } : {}),
        },
      })
      report.importedRelations += 1
    }

    root.items.forEach((item) => {
      registerNode(item)
    })

    const resolveRef = (ref: string): string | null => {
      const key = normalizeKey(ref)
      if (!key) return null
      const byId = nodeByLowerId.get(key)
      if (byId) return byId.id

      const nameMatches = nodeIdsByLowerName.get(key) ?? []
      if (nameMatches.length === 0) return null
      if (nameMatches.length > 1) {
        report.warnings.push(`Reference "${ref}" matched multiple items. Linked to "${nameMatches[0]}".`)
      }
      return nameMatches[0] ?? null
    }

    pendingRefs.forEach((ref) => {
      const targetId = resolveRef(ref.ref)
      if (!targetId) {
        report.warnings.push(`Skipped unresolved reference "${ref.ref}" on "${ref.sourceId}".`)
        report.skippedRelations += 1
        return
      }
      pushEdge({
        source: ref.sourceId,
        target: targetId,
        kind: ref.kind,
        probability: ref.probability,
        recovery: ref.recovery,
      })
    })

    if (Array.isArray(root.workers)) {
      const workerIds = new Set<string>()
      root.workers.forEach((entry) => {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
          report.warnings.push('Skipped non-object worker entry.')
          return
        }
        const worker = entry as Record<string, unknown>
        let name = typeof worker.name === 'string' ? worker.name.trim() : ''
        if (!name) {
          report.warnings.push('Skipped worker without valid "name".')
          return
        }

        let id = typeof worker.id === 'string' ? worker.id.trim() : ''
        if (!id) id = name
        while (workerIds.has(normalizeKey(id))) {
          name = makeDuplicateName(name)
          id = name
          report.renamedItems += 1
          report.warnings.push(`Duplicate worker identity detected. Renamed worker to "${name}".`)
        }
        workerIds.add(normalizeKey(id))

        const skills = Array.isArray(worker.skills)
          ? Array.from(
              new Set(
                worker.skills
                  .map((skill) => (typeof skill === 'string' ? skill.trim().toLowerCase() : ''))
                  .filter(Boolean)
              )
            )
          : []
        const availability = normalizeAvailability(
          worker.availability ?? worker.availabilityPercent,
          true,
          report,
          `worker "${name}"`
        )

        workers.push({
          id,
          name,
          skills,
          availabilityPercent: availability,
        })
        report.importedWorkers += 1
      })
    } else if (root.workers !== undefined) {
      report.warnings.push('Ignored non-array "workers".')
      report.normalizedValues += 1
    }

    const state = normalizeState({
      nodes,
      edges,
      workers,
    })
    return { state, report }
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

  export function hasMeaningfulDraft(storage: Storage = localStorage): boolean {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return false

    try {
      const draft = deserialize(raw)
      return getStateSignature(draft) !== getStateSignature(createInitialState())
    } catch {
      return false
    }
  }

  export function archiveDraftProject(storage: Storage = localStorage): SavedProject | null {
    if (!hasMeaningfulDraft(storage)) return null
    const draftState = loadFromStorage(storage)
    const id = createProjectId()
    return saveProject(
      {
        id,
        name: `drafts/${id}`,
        state: draftState,
      },
      storage
    )
  }

  export function listProjects(storage: Storage = localStorage): SavedProject[] {
    const raw = storage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as SavedProject[]
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((project) => ({
          ...project,
          state: normalizeState(project.state),
        }))
        .filter((project) => project.name)
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
    const projectId = input.id ?? createProjectId()
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

  /**
   * Builds a stable, position-free signature of a graph state so draft detection
   * compares only meaningful project content, not layout noise or missing defaults.
   *
   * We use this when deciding whether `/projects/new` contains a real draft that
   * should be auto-archived before starting a fresh project.
   *
   * Example return value:
   * `{"nodes":[{"label":"Total Project","estimate":0,"risk":"none","priority":"medium","limit":null,"assigneeIds":[],"requiredSkills":[]}],"edges":[],"workers":[]}`
   */
  function getStateSignature(state: GraphState): string {
    const normalized = normalizeState(state)
    return JSON.stringify({
      nodes: normalized.nodes.map((node) => ({
        label: node.data.label,
        estimate: node.data.estimate,
        risk: normalizeRisk(node.data.risk),
        priority: normalizePriority(node.data.priority),
        limit: typeof node.data.limit === 'number' ? node.data.limit : null,
        assigneeIds: [...(node.data.assigneeIds ?? [])],
        requiredSkills: [...(node.data.requiredSkills ?? [])],
      })),
      edges: normalized.edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
        kind: normalizeEdgeKind(edge.data?.kind),
        probability: normalizeProbability(edge.data?.probability),
        recovery: normalizeRecovery(edge.data?.recovery),
      })),
      workers: normalized.workers.map((worker) => ({
        id: worker.id,
        name: worker.name,
        skills: [...worker.skills],
        availabilityPercent: normalizeAvailability(worker.availabilityPercent),
      })),
    })
  }

  function normalizeState(state: Partial<GraphState>): GraphState {
    const rawNodes = Array.isArray(state.nodes) ? (state.nodes as GraphNode[]) : []
    const rawEdges = Array.isArray(state.edges) ? (state.edges as GraphEdge[]) : []
    return {
      nodes: rawNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          risk: normalizeRisk(node.data?.risk),
          assigneeIds: Array.isArray(node.data?.assigneeIds) ? node.data.assigneeIds : [],
          requiredSkills: Array.isArray(node.data?.requiredSkills) ? node.data.requiredSkills : [],
        },
      })),
      edges: rawEdges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          kind: normalizeEdgeKind(edge.data?.kind),
          probability: normalizeProbability(edge.data?.probability),
          recovery: normalizeRecovery(edge.data?.recovery),
        },
        markerEnd:
          edge.markerEnd ??
          (normalizeEdgeKind(edge.data?.kind) === 'after'
            ? { type: MarkerType.Arrow }
            : { type: MarkerType.ArrowClosed }),
      })),
      workers: Array.isArray(state.workers)
        ? state.workers.map((worker) => ({
            id: worker.id,
            name: worker.name,
            skills: Array.isArray(worker.skills) ? worker.skills : [],
            availabilityPercent: normalizeAvailability(worker.availabilityPercent),
          }))
        : [],
    }
  }

  function normalizeAvailability(
    input: unknown,
    collectWarnings: boolean = false,
    report?: ImportReport,
    context?: string
  ): number {
    const value = typeof input === 'number' ? input : Number(input)
    if (!Number.isFinite(value)) {
      if (collectWarnings && report) {
        report.normalizedValues += 1
        report.warnings.push(`Invalid availability${context ? ` for ${context}` : ''}. Defaulted to 100.`)
      }
      return 100
    }
    const normalized = Math.min(100, Math.max(0, Math.round(value)))
    if (collectWarnings && report && normalized !== value) {
      report.normalizedValues += 1
      report.warnings.push(`Clamped availability${context ? ` for ${context}` : ''} to ${normalized}.`)
    }
    return normalized
  }

  function normalizeRisk(input: unknown): ProjectStats.RiskLevel {
    switch (input) {
      case 'none':
      case 'low':
      case 'medium':
      case 'high':
      case 'extreme':
        return input
      default:
        return 'none'
    }
  }

  function normalizeRiskWithReport(input: unknown, report: ImportReport, context: string): ProjectStats.RiskLevel {
    const normalized = normalizeRisk(input)
    if (input !== undefined && normalized !== input) {
      report.normalizedValues += 1
      report.warnings.push(`Invalid risk on ${context}. Defaulted to "none".`)
    }
    return normalized
  }

  function normalizePriority(input: unknown): Priority {
    switch (input) {
      case 'minor':
      case 'medium':
      case 'major':
      case 'critical':
        return input
      default:
        return 'medium'
    }
  }

  function normalizePriorityWithReport(input: unknown, report: ImportReport, context: string): Priority {
    const normalized = normalizePriority(input)
    if (input !== undefined && normalized !== input) {
      report.normalizedValues += 1
      report.warnings.push(`Invalid priority on ${context}. Defaulted to "medium".`)
    }
    return normalized
  }

  function normalizeEstimate(input: unknown, report: ImportReport, context: string): number {
    if (input === undefined || input === null || input === '') return 0
    const value = typeof input === 'number' ? input : Number(input)
    if (!Number.isFinite(value)) {
      report.normalizedValues += 1
      report.warnings.push(`Invalid estimate on ${context}. Defaulted to 0.`)
      return 0
    }
    if (value < 0) {
      report.normalizedValues += 1
      report.warnings.push(`Negative estimate on ${context}. Clamped to 0.`)
      return 0
    }
    return value
  }

  function normalizeAssignee(
    input: unknown,
    report: ImportReport,
    context: string
  ): { assigneeIds: string[]; requiredSkills: string[] } {
    if (typeof input !== 'string') {
      if (input !== undefined) {
        report.normalizedValues += 1
        report.warnings.push(`Invalid assignee on ${context}. Ignored.`)
      }
      return { assigneeIds: [], requiredSkills: [] }
    }

    const value = input.trim()
    if (!value) return { assigneeIds: [], requiredSkills: [] }
    if (value.startsWith('@')) {
      const workerId = value.slice(1).trim()
      return workerId ? { assigneeIds: [workerId], requiredSkills: [] } : { assigneeIds: [], requiredSkills: [] }
    }
    if (value.startsWith('#')) {
      const skill = value.slice(1).trim().toLowerCase()
      return skill ? { assigneeIds: [], requiredSkills: [skill] } : { assigneeIds: [], requiredSkills: [] }
    }

    report.normalizedValues += 1
    report.warnings.push(`Invalid assignee "${value}" on ${context}. Use "@workerId" or "#skill".`)
    return { assigneeIds: [], requiredSkills: [] }
  }

  function encodeAssignee(data: NodeData): string | null {
    const workerId = data.assigneeIds?.[0]?.trim()
    if (workerId) return `@${workerId}`
    const skill = data.requiredSkills?.[0]?.trim()
    if (skill) return `#${skill}`
    return null
  }

  function normalizeProbability(input: unknown): number {
    const value = typeof input === 'number' ? input : Number(input)
    if (!Number.isFinite(value)) return 100
    return Math.max(0, Math.min(100, Math.round(value)))
  }

  function normalizeRecovery(input: unknown): number {
    const value = typeof input === 'number' ? input : Number(input)
    if (!Number.isFinite(value)) return 0
    return Math.max(0, Math.min(100, Math.round(value)))
  }

  function normalizeEdgeKind(input: unknown): RelationKind {
    return input === 'after' ? 'after' : 'contains'
  }

  function normalizeKey(value: string): string {
    return value.trim().toLowerCase()
  }

  function createImportReport(): ImportReport {
    return {
      importedItems: 0,
      importedWorkers: 0,
      importedRelations: 0,
      skippedRelations: 0,
      normalizedValues: 0,
      renamedItems: 0,
      warnings: [],
    }
  }
}
