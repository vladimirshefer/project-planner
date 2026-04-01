import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useEdgesState,
  useNodesState,
  Connection,
  Edge,
  Node,
  Position,
  NodeProps,
  useReactFlow,
  Panel,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  EdgeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import dagre from 'dagre'
import { StatsEngine } from '../utils/stats-engine'
import { ProjectStats } from '../utils/project-stats'
import { EstimationsGraph } from '../utils/estimations-graph'
import { NodeView } from './NodeView'
import { collectKnownSkills } from '../utils/skills'

type NodeData = EstimationsGraph.NodeData
type EdgeData = EstimationsGraph.EdgeData
type Priority = EstimationsGraph.Priority

const NODE_WIDTH = 220
const NODE_HEIGHT = 180

const WorkerPoolContext = createContext<EstimationsGraph.WorkerDto[]>([])
const SkillSuggestionsContext = createContext<string[]>([])

const getNodeSize = (node: Node<NodeData>) => {
  const measuredWidth = node.measured?.width ?? node.width
  const measuredHeight = node.measured?.height ?? node.height
  return {
    width: measuredWidth && measuredWidth > 0 ? measuredWidth : NODE_WIDTH,
    height: measuredHeight && measuredHeight > 0 ? measuredHeight : NODE_HEIGHT,
  }
}

const getLayoutedElements = (
  nodes: Node<NodeData>[],
  edges: Edge[],
  direction: string = 'TB'
) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  const isHorizontal = direction === 'LR'

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 90,
    nodesep: 70,
  })

  nodes.forEach((node) => {
    const size = getNodeSize(node)
    dagreGraph.setNode(node.id, size)
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const size = getNodeSize(node)

    return {
      ...node,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      position: {
        x: nodeWithPosition.x - size.width / 2,
        y: nodeWithPosition.y - size.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

function EditableNode({ id, data }: NodeProps<Node<NodeData>>) {
  const { setNodes, setEdges } = useReactFlow()
  const workers = useContext(WorkerPoolContext)
  const skillSuggestions = useContext(SkillSuggestionsContext)

  const updateNodeData = useCallback((key: keyof NodeData, value: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              [key]: value,
            },
          }
        }
        return node
      })
    )
  }, [id, setNodes])

  const deleteNode = useCallback(() => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
  }, [id, setNodes, setEdges])

  const riskLevels: ProjectStats.RiskLevel[] = ['none', 'low', 'medium', 'high', 'extreme']
  const priorities: Priority[] = ['minor', 'medium', 'major', 'critical']

  const totals = useMemo(
    () => (data.histogram ? ProjectStats.extractViewMarks(data.histogram, data.successProb ?? 1) : null),
    [data.histogram, data.successProb]
  )

  return (
    <NodeView
      data={data}
      workers={workers}
      skillSuggestions={skillSuggestions}
      priorities={priorities}
      riskLevels={riskLevels}
      totals={totals}
      onUpdateData={updateNodeData}
      onDeleteNode={deleteNode}
    />
  )
}

function EditableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<Edge<EdgeData>>) {
  const { setEdges } = useReactFlow()
  const kind = data?.kind ?? 'contains'
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const updateEdgeData = useCallback(
    (key: keyof EdgeData, val: number | EdgeData['kind']) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            const nextKind = key === 'kind' ? (val as EdgeData['kind']) : (edge.data?.kind ?? 'contains')
            return {
              ...edge,
              markerEnd:
                nextKind === 'after'
                  ? { type: MarkerType.Arrow }
                  : { type: MarkerType.ArrowClosed },
              data: {
                ...edge.data,
                [key]: val,
              },
            }
          }
          return edge
        })
      )
    },
    [id, setEdges]
  )

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={
          kind === 'after'
            ? { stroke: '#9ca3af', strokeWidth: 1.2, strokeDasharray: '6 4', opacity: 0.85 }
            : { strokeWidth: 2 }
        }
      />
      <EdgeLabelRenderer>
        {(() => {
          return (
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white p-1 rounded border border-blue-200 shadow-md flex flex-col gap-1 text-[8px] min-w-[60px]"
        >
          <div className="flex items-center justify-between gap-1 border-b pb-1">
            <span className="text-gray-400 font-semibold uppercase">Type:</span>
            <select
              value={kind}
              onChange={(e) => updateEdgeData('kind', e.target.value as EdgeData['kind'])}
              className="text-[8px] border rounded px-1 py-0.5 bg-white text-gray-700"
            >
              <option value="contains">contains</option>
              <option value="after">after</option>
            </select>
          </div>
          {kind === 'contains' && (
            <>
              <div className="flex items-center justify-between gap-1 border-b pb-1">
                <span className="text-gray-400 font-semibold uppercase">Occur:</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    defaultValue={data?.probability ?? 100}
                    onChange={(e) => updateEdgeData('probability', parseFloat(e.target.value) || 0)}
                    className="w-7 text-right outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5 text-blue-600 font-bold bg-white"
                    min="0"
                    max="100"
                  />
                  <span className="text-blue-400 font-bold">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-1" title="Chance to still succeed if this dependency fails">
                <span className="text-gray-400 font-semibold uppercase">Recov:</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    defaultValue={data?.recovery ?? 0}
                    onChange={(e) => updateEdgeData('recovery', parseFloat(e.target.value) || 0)}
                    className="w-7 text-right outline-none focus:ring-1 focus:ring-green-400 rounded px-0.5 text-green-600 font-bold bg-white"
                    min="0"
                    max="100"
                  />
                  <span className="text-green-400 font-bold">%</span>
                </div>
              </div>
            </>
          )}
        </div>
          )
        })()}
      </EdgeLabelRenderer>
    </>
  )
}

const nodeTypes = {
  editable: EditableNode,
}

const edgeTypes = {
  editable: EditableEdge,
}

type FlowDemoProps = {
  initialState?: EstimationsGraph.GraphState
  activeProjectName?: string | null
  focusNodeId?: string | null
  onSaveProject?: (name: string, state: EstimationsGraph.GraphState) => void
  onOpenProjects?: () => void
  onOpenWorkers?: () => void
  onOpenTimeline?: () => void
}

export default function FlowDemo({
  initialState,
  activeProjectName,
  focusNodeId,
  onSaveProject,
  onOpenProjects,
  onOpenWorkers,
  onOpenTimeline,
}: FlowDemoProps) {
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false)
  const [modalText, setModalText] = useState('')
  const [importError, setImportError] = useState('')
  const [importReport, setImportReport] = useState<EstimationsGraph.ImportReport | null>(null)

  const fallbackState = useMemo(() => EstimationsGraph.loadFromStorage(), [])
  const bootstrapState = initialState ?? fallbackState
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(bootstrapState.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(bootstrapState.edges)
  const [workers, setWorkers] = useState<EstimationsGraph.WorkerDto[]>(bootstrapState.workers ?? [])
  const skillSuggestions = useMemo(
    () => collectKnownSkills({ workers, nodes }),
    [workers, nodes]
  )

  const { fitView, screenToFlowPosition, setCenter } = useReactFlow()

  useEffect(() => {
    EstimationsGraph.saveToStorage({ nodes, edges, workers })
  }, [nodes, edges, workers])

  useEffect(() => {
    if (!focusNodeId) return
    const target = nodes.find((node) => node.id === focusNodeId)
    if (!target) return
    const x = target.position.x + getNodeSize(target).width / 2
    const y = target.position.y + getNodeSize(target).height / 2
    window.requestAnimationFrame(() => {
      setCenter(x, y, { zoom: 1.2, duration: 300 })
    })
  }, [focusNodeId, nodes, setCenter])

  const computedNodes = useMemo(() => {
    const adj = new Map<string, Array<{ to: string; prob: number; recovery: number }>>()
    edges.forEach((e) => {
      const kind = (e.data as EdgeData | undefined)?.kind ?? 'contains'
      if (kind !== 'contains') return
      if (!adj.has(e.source)) adj.set(e.source, [])
      const prob = (e.data as EdgeData)?.probability ?? 100
      const recovery = (e.data as EdgeData)?.recovery ?? 0
      adj.get(e.source)!.push({ to: e.target, prob: prob / 100, recovery: recovery / 100 })
    })

    const memo = new Map<string, { dist: StatsEngine.Distribution; successProb: number }>()
    const processing = new Set<string>()

    function computeDist(id: string): { dist: StatsEngine.Distribution; successProb: number } {
      if (memo.has(id)) return memo.get(id)!
      if (processing.has(id)) return { dist: StatsEngine.createConstant(0), successProb: 1 }

      processing.add(id)
      const node = nodes.find((n) => n.id === id)
      if (!node) {
        processing.delete(id)
        return { dist: StatsEngine.createConstant(0), successProb: 1 }
      }

      const data = node.data
      let currentDist = ProjectStats.generateFromMedianAndRisk(data.estimate ?? 0, data.risk ?? 'none')
      let successProb = 1.0

      const children = adj.get(id) || []
      children.forEach((child) => {
        const childResult = computeDist(child.to)
        const childEffectiveDist = StatsEngine.applyProbability(childResult.dist, child.prob)
        const childEffectiveSuccess = childResult.successProb + (1 - childResult.successProb) * child.recovery
        const childContributionToSuccess = (1 - child.prob) + child.prob * childEffectiveSuccess

        successProb *= childContributionToSuccess
        currentDist = StatsEngine.convolve(currentDist, childEffectiveDist)
      })

      if (data.limit !== undefined && data.limit !== null) {
        const localSuccessProb = StatsEngine.getProbabilityOfLimit(currentDist, data.limit)
        successProb *= localSuccessProb
      }

      const result = { dist: currentDist, successProb }
      memo.set(id, result)
      processing.delete(id)
      return result
    }

    return nodes.map((n) => {
      const result = computeDist(n.id)
      return {
        ...n,
        data: {
          ...n.data,
          histogram: result.dist,
          successProb: result.successProb,
        },
      }
    })
  }, [nodes, edges])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'editable',
          data: { kind: 'contains', probability: 100, recovery: 0 },
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        eds
      )
    )
  }, [setEdges])

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, direction)
      setNodes([...layoutedNodes])
      setEdges([...layoutedEdges])
      window.requestAnimationFrame(() => {
        fitView()
      })
    },
    [nodes, edges, setNodes, setEdges, fitView]
  )

  const onClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire project?')) {
      EstimationsGraph.clearStorage()
      setNodes([])
      setEdges([])
      setWorkers([])
    }
  }, [setNodes, setEdges, setWorkers])

  const openCodeEditor = useCallback(() => {
    setModalText(EstimationsGraph.serializeText({ nodes, edges, workers }))
    setImportError('')
    setImportReport(null)
    setIsCodeEditorOpen(true)
  }, [nodes, edges, workers])

  const closeModal = useCallback(() => {
    setIsCodeEditorOpen(false)
    setImportError('')
  }, [])

  const onCodeApply = useCallback(() => {
    try {
      const result = EstimationsGraph.deserializeText(modalText)
      setNodes(result.state.nodes as Node<NodeData>[])
      setEdges(result.state.edges as Edge[])
      setWorkers(result.state.workers ?? [])
      setImportReport(result.report)
      setIsCodeEditorOpen(false)
      setImportError('')
    } catch (e) {
      if (e instanceof Error) {
        setImportError(e.message)
      } else {
        setImportError('Invalid YAML.')
      }
    }
  }, [modalText, setNodes, setEdges, setWorkers])

  const addNodeAt = useCallback(
    (position: { x: number; y: number }) => {
      setNodes((nds) => {
        let index = nds.length + 1
        while (nds.some((node) => node.id === `I-${index}`)) {
          index += 1
        }

        const newNode: Node<NodeData> = {
          id: `I-${index}`,
          position,
          type: 'editable',
          data: {
            label: `Task ${index}`,
            estimate: 1,
            risk: 'none',
            priority: 'medium',
            assigneeIds: [],
            requiredSkills: [],
          },
        }

        return [...nds, newNode]
      })
    },
    [setNodes]
  )

  const onAddNode = useCallback(() => {
    const center = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    addNodeAt({
      x: center.x - 90,
      y: center.y - 40,
    })
  }, [screenToFlowPosition, addNodeAt])

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.detail !== 2) return
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })
      addNodeAt(position)
    },
    [screenToFlowPosition, addNodeAt]
  )

  const onSaveClick = useCallback(() => {
    const suggestedName = activeProjectName?.trim() || 'New Project'
    const name = window.prompt('Save project as:', suggestedName)
    if (!name || !name.trim()) return

    const state: EstimationsGraph.GraphState = { nodes, edges, workers }
    if (onSaveProject) {
      onSaveProject(name.trim(), state)
    } else {
      EstimationsGraph.saveProject({ name: name.trim(), state })
    }
  }, [activeProjectName, nodes, edges, workers, onSaveProject])

  return (
    <div className="h-full w-full overflow-hidden">
      <WorkerPoolContext.Provider value={workers}>
        <SkillSuggestionsContext.Provider value={skillSuggestions}>
          <ReactFlow
          nodes={computedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background gap={12} size={1} />
          <Panel position="top-right" className="bg-white p-2 rounded shadow-md border flex gap-2">
            <button
              onClick={onSaveClick}
              className="px-3 py-1 bg-teal-600 text-white rounded text-xs font-semibold hover:bg-teal-700 transition-colors"
            >
              Save
            </button>
            {onOpenProjects && (
              <button
                onClick={onOpenProjects}
                className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-semibold hover:bg-gray-800 transition-colors"
              >
                Projects
              </button>
            )}
            {onOpenWorkers && (
              <button
                onClick={onOpenWorkers}
                className="px-3 py-1 bg-cyan-600 text-white rounded text-xs font-semibold hover:bg-cyan-700 transition-colors"
              >
                Workers
              </button>
            )}
            {onOpenTimeline && (
              <button
                onClick={onOpenTimeline}
                className="px-3 py-1 bg-fuchsia-600 text-white rounded text-xs font-semibold hover:bg-fuchsia-700 transition-colors"
              >
                Timeline
              </button>
            )}
            <button
              onClick={openCodeEditor}
              className="px-3 py-1 bg-indigo-500 text-white rounded text-xs font-semibold hover:bg-indigo-600 transition-colors"
            >
              Edit Code
            </button>
            <button
              onClick={onAddNode}
              className="px-3 py-1 bg-emerald-500 text-white rounded text-xs font-semibold hover:bg-emerald-600 transition-colors"
            >
              Add Node
            </button>
            <button
              onClick={() => onLayout('TB')}
              className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600 transition-colors"
            >
              Tree Layout (V)
            </button>
            <button
              onClick={() => onLayout('LR')}
              className="px-3 py-1 bg-slate-500 text-white rounded text-xs font-semibold hover:bg-slate-600 transition-colors"
            >
              Tree Layout (H)
            </button>
            <button
              onClick={onClear}
              className="px-3 py-1 border border-red-200 text-red-500 rounded text-xs font-semibold hover:bg-red-50 transition-colors"
            >
              Clear
            </button>
          </Panel>

          {isCodeEditorOpen && (
            <Panel position="top-left" className="!left-0 !top-0 !m-0 !p-0">
              <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-lg border shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Edit Project YAML</h3>
                    <button
                      onClick={closeModal}
                      className="px-2 py-1 text-xs rounded border text-gray-600 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                  <textarea
                    value={modalText}
                    onChange={(e) => setModalText(e.target.value)}
                    className="w-full min-h-[320px] border rounded p-2 text-xs font-mono text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={'Paste YAML like:\nversion: 1\nitems:\n  - name: "Item A"'}
                  />
                  {importError && <p className="text-xs text-red-600">{importError}</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={onCodeApply}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          )}
          {importReport && (
            <Panel position="top-left" className="!left-0 !top-0 !m-0 !p-0">
              <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                <div className="bg-white w-full max-w-2xl rounded-lg border shadow-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-800">Code Apply Report</h3>
                    <button
                      onClick={() => setImportReport(null)}
                      className="px-2 py-1 text-xs rounded border text-gray-600 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-700">
                    <p>Items: <span className="font-semibold">{importReport.importedItems}</span></p>
                    <p>Workers: <span className="font-semibold">{importReport.importedWorkers}</span></p>
                    <p>Relations: <span className="font-semibold">{importReport.importedRelations}</span></p>
                    <p>Normalized: <span className="font-semibold">{importReport.normalizedValues}</span></p>
                    <p>Skipped rels: <span className="font-semibold">{importReport.skippedRelations}</span></p>
                    <p>Renamed: <span className="font-semibold">{importReport.renamedItems}</span></p>
                  </div>
                  <div className="max-h-[280px] overflow-auto border rounded p-2 text-xs text-gray-700 font-mono bg-gray-50">
                    {importReport.warnings.length === 0 ? (
                      <p>No warnings.</p>
                    ) : (
                      importReport.warnings.map((warning, idx) => (
                        <p key={`${warning}-${idx}`}>- {warning}</p>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </Panel>
          )}
          </ReactFlow>
        </SkillSuggestionsContext.Provider>
      </WorkerPoolContext.Provider>
    </div>
  )
}
