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
import {
  LuLink,
  LuPlus,
  LuTrash2,
  LuWorkflow
} from 'react-icons/lu'
import { ProjectStats } from '../utils/project-stats'
import { EstimationsGraph } from '../utils/estimations-graph'
import { ProjectEstimator } from '../utils/project-estimator'
import { projectManager } from '../utils/project-manager'
import { buildShareUrl, encodeSharePayload, isShareSupported, isShareUrlTooLarge } from '../utils/share-url'
import { NodeView } from '../pages/EditorPage/NodeView'
import { EdgeView } from './EdgeView'
import { EditorNavbar } from './EditorNavbar'
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

const getLayoutedElements = (nodes: Node<NodeData>[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))

  dagreGraph.setGraph({
    rankdir: 'TB',
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
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      position: {
        x: nodeWithPosition.x - size.width / 2,
        y: nodeWithPosition.y - size.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

const getLayoutedState = (state: EstimationsGraph.GraphState): EstimationsGraph.GraphState => {
  const { nodes, edges } = getLayoutedElements(state.nodes, state.edges)
  return {
    ...state,
    nodes,
    edges,
  }
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
  const probability = data?.probability ?? 100
  const recovery = data?.recovery ?? 0
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
            const nextData =
              key === 'kind' && val === 'after'
                ? {
                    ...edge.data,
                    kind: 'after' as EdgeData['kind'],
                    probability: 100,
                    recovery: 0,
                  }
                : {
                    ...edge.data,
                    [key]: val,
                  }
            return {
              ...edge,
              markerEnd:
                nextKind === 'after'
                  ? { type: MarkerType.Arrow }
                  : { type: MarkerType.ArrowClosed },
              data: nextData,
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
        <EdgeView
          kind={kind}
          probability={probability}
          recovery={recovery}
          labelX={labelX}
          labelY={labelY}
          onChangeKind={(value) => updateEdgeData('kind', value ?? 'contains')}
          onChangeProbability={(value) => updateEdgeData('probability', value)}
          onChangeRecovery={(value) => updateEdgeData('recovery', value)}
        />
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

export default function FlowDemo({
  initialState,
  projectId,
  projectName,
  focusNodeId,
  onSaveProject,
  onSaveProjectAsNew,
  onRenameProject
}: {
  initialState?: EstimationsGraph.GraphState
  projectId?: string | null
  projectName?: string | null
  focusNodeId?: string | null
  onSaveProject?: (name: string, state: EstimationsGraph.GraphState) => void
  onSaveProjectAsNew?: (name: string, state: EstimationsGraph.GraphState) => void
  onRenameProject?: (name: string, state: EstimationsGraph.GraphState) => void
}) {
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false)
  const [modalText, setModalText] = useState('')
  const [importError, setImportError] = useState('')
  const [importReport, setImportReport] = useState<EstimationsGraph.ImportReport | null>(null)
  const [shareStatus, setShareStatus] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const iconClassName = 'h-4 w-4 shrink-0'

  const bootstrapState = useMemo(
    () => getLayoutedState(initialState ?? EstimationsGraph.createInitialState()),
    [initialState]
  )
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData>>(bootstrapState.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(bootstrapState.edges)
  const [workers, setWorkers] = useState<EstimationsGraph.WorkerDto[]>(bootstrapState.workers ?? [])
  const skillSuggestions = useMemo(
    () => collectKnownSkills({ workers, nodes }),
    [workers, nodes]
  )

  const { fitView, screenToFlowPosition, setCenter } = useReactFlow()

  useEffect(() => {
    if (!projectId || !projectName?.trim()) return
    projectManager.saveProject({
      projectId: projectId,
      name: projectName.trim(),
      state: { nodes, edges, workers },
    })
  }, [projectId, projectName, nodes, edges, workers])

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
    return ProjectEstimator.annotateState({ nodes, edges, workers }).nodes
  }, [nodes, edges, workers])

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
    () => {
      const layoutedState = getLayoutedState({ nodes, edges, workers })
      setNodes([...layoutedState.nodes])
      setEdges([...layoutedState.edges])
      window.requestAnimationFrame(() => {
        fitView()
      })
    },
    [nodes, edges, workers, setNodes, setEdges, fitView]
  )

  const onClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire project?')) {
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

  const promptForProjectName = useCallback((defaultName: string) => {
    const name = window.prompt('Save project as:', defaultName)
    return name?.trim() || null
  }, [])

  const onSaveClick = useCallback(() => {
    const state: EstimationsGraph.GraphState = { nodes, edges, workers }

    if (projectId && projectName?.trim() && onSaveProject) {
      onSaveProject(projectName.trim(), state)
      return
    }

    const suggestedName = projectName?.trim() || 'New Project'
    const name = promptForProjectName(suggestedName)
    if (!name) return
    if (onSaveProject) {
      onSaveProject(name, state)
    } else {
      projectManager.saveProject({ name, state })
    }
  }, [projectId, projectName, nodes, edges, workers, onSaveProject, promptForProjectName])

  const onRenameClick = useCallback(() => {
    if (!projectId || !projectName?.trim()) return

    const name = promptForProjectName(projectName.trim())
    if (!name) return

    const state: EstimationsGraph.GraphState = { nodes, edges, workers }
    if (onRenameProject) {
      onRenameProject(name, state)
      return
    }

    if (onSaveProject) {
      onSaveProject(name, state)
    }
  }, [projectId, projectName, nodes, edges, workers, onRenameProject, onSaveProject, promptForProjectName])

  const onSaveAsNewClick = useCallback(() => {
    const suggestedName = projectName?.trim() || 'New Project'
    const name = promptForProjectName(suggestedName)
    if (!name) return

    const state: EstimationsGraph.GraphState = { nodes, edges, workers }
    if (onSaveProjectAsNew) {
      onSaveProjectAsNew(name, state)
      return
    }

    projectManager.saveProject({ name, state })
  }, [projectName, nodes, edges, workers, onSaveProjectAsNew, promptForProjectName])

  const onShareClick = useCallback(async () => {
    setShareStatus(null)

    if (!isShareSupported()) {
      setShareStatus('Share links are not supported in this browser.')
      return
    }

    setIsSharing(true)
    try {
      const state: EstimationsGraph.GraphState = { nodes, edges, workers }
      const payload = await encodeSharePayload(state)
      const url = buildShareUrl(payload)

      if (isShareUrlTooLarge(url)) {
        setShareStatus('Project is too large for a share link. Use YAML export instead.')
        return
      }

      await navigator.clipboard.writeText(url)
      setShareStatus('Share link copied.')
    } catch (error) {
      setShareStatus(error instanceof Error ? error.message : 'Failed to create share link.')
    } finally {
      setIsSharing(false)
    }
  }, [nodes, edges, workers])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 's') return
      if (!event.ctrlKey && !event.metaKey) return
      event.preventDefault()
      event.stopPropagation()
      onSaveClick()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onSaveClick])

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
            <Panel position="top-left" className="top-[7.5rem] left-3 m-0 p-0 sm:top-4 sm:left-4">
              <EditorNavbar
                projectId={projectId}
                onSave={onSaveClick}
                onRename={onRenameClick}
                onSaveAsNew={onSaveAsNewClick}
                onEditCode={openCodeEditor}
              />
            </Panel>
            <Panel
              position="top-right"
              className="top-3 right-3 m-0 p-0 top-4 right-4 sm:w-auto sm:max-w-none"
            >
              <div className="rounded-xl border bg-white/95 p-2 shadow-md backdrop-blur-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left">
                    <p className="text-xs font-semibold uppercase text-slate-500">Active project</p>
                    <p className="break-words text-xs font-semibold text-slate-800">
                      {projectName?.trim() || 'Unsaved Draft'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
                    <button
                      onClick={() => {
                        void onShareClick()
                      }}
                      disabled={isSharing}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-700 px-3 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:h-9"
                    >
                      <LuLink className={iconClassName} aria-hidden="true" />
                      <span>{isSharing ? 'Sharing...' : 'Share'}</span>
                    </button>
                    <button
                      onClick={onAddNode}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 sm:h-9"
                    >
                      <LuPlus className={iconClassName} aria-hidden="true" />
                      <span>Add Node</span>
                    </button>
                    <button
                      onClick={onLayout}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-500 px-3 text-xs font-semibold text-white transition-colors hover:bg-blue-600 sm:h-9"
                    >
                      <LuWorkflow className={iconClassName} aria-hidden="true" />
                      <span>Tree Layout</span>
                    </button>
                    <button
                      onClick={onClear}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-red-200 px-3 text-xs font-semibold text-red-500 transition-colors hover:bg-red-50 sm:h-9"
                    >
                      <LuTrash2 className={iconClassName} aria-hidden="true" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>
                {shareStatus && (
                  <p className="px-1 pt-2 text-xs text-slate-600">
                    {shareStatus}
                  </p>
                )}
              </div>
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
