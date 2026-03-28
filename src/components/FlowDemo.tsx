import { useCallback, useMemo } from 'react'
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
  Handle,
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

// --- Types ---

type NodeData = {
  label: string;
  est30?: number;
  est70?: number;
  est95?: number;
  histogram?: StatsEngine.Distribution;
};

type EdgeData = {
  probability?: number;
};

// Dagre graph setup
const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 180
const nodeHeight = 240

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: newNodes, edges }
}

function EditableNode({ id, data }: NodeProps<Node<NodeData>>) {
  const { setNodes } = useReactFlow()

  const updateNodeData = useCallback((key: keyof NodeData, value: string | number) => {
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

  // Extract sugar for presentation from the histogram
  const totals = useMemo(() => 
    data.histogram ? ProjectStats.extractViewMarks(data.histogram) : null,
    [data.histogram]
  );

  return (
    <div className="rounded border bg-white p-3 shadow-md min-w-[170px] flex flex-col gap-2">
      <Handle type="target" position={Position.Top} />
      
      {/* Name/Label */}
      <input
        type="text"
        className="w-full border-b pb-1 text-center font-bold text-sm focus:outline-none focus:ring-0 bg-white"
        defaultValue={data.label}
        onChange={(e) => updateNodeData('label', e.target.value)}
      />

      {/* Estimates Inputs */}
      <div className="flex flex-col gap-1 text-[10px] text-gray-500 pt-1">
        <div className="flex justify-between items-center gap-2">
          <span className="whitespace-nowrap">30% (Opt):</span>
          <input
            type="number"
            className="w-16 border rounded px-1 text-right text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            defaultValue={data.est30}
            onChange={(e) => updateNodeData('est30', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="whitespace-nowrap">70% (Real):</span>
          <input
            type="number"
            className="w-16 border rounded px-1 text-right text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            defaultValue={data.est70}
            onChange={(e) => updateNodeData('est70', parseFloat(e.target.value) || 0)}
          />
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="whitespace-nowrap">95% (Pess):</span>
          <input
            type="number"
            className="w-16 border rounded px-1 text-right text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            defaultValue={data.est95}
            onChange={(e) => updateNodeData('est95', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>

      {/* Calculated Rollups (Presentation Sugar) */}
      {totals && (
        <div className="mt-1 border-t pt-2 flex flex-col gap-1 bg-blue-50/50 -mx-3 px-3 pb-2">
          <div className="flex justify-between items-center font-bold text-xs text-blue-700">
            <span>Median (50%):</span>
            <span>{totals.p50.toFixed(1)}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-[9px] text-blue-500 text-center border-t border-blue-100 pt-1">
            <div title="30% Project Total" className="flex flex-col">
              <span className="opacity-60">30%</span>
              <span className="font-semibold">{totals.p30.toFixed(1)}</span>
            </div>
            <div title="70% Project Total" className="flex flex-col">
              <span className="opacity-60">70%</span>
              <span className="font-semibold">{totals.p70.toFixed(1)}</span>
            </div>
            <div title="95% Project Total" className="flex flex-col">
              <span className="opacity-60">95%</span>
              <span className="font-semibold">{totals.p95.toFixed(1)}</span>
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
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const onProbabilityChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(evt.target.value) || 0
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: {
                ...edge.data,
                probability: val,
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white px-1 py-0.5 rounded border border-blue-200 shadow-sm flex items-center gap-1 text-[10px]"
        >
          <input
            type="number"
            defaultValue={data?.probability ?? 100}
            onChange={onProbabilityChange}
            className="w-8 text-right outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5 text-blue-600 font-bold"
            min="0"
            max="100"
          />
          <span className="text-gray-400">%</span>
        </div>
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

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 50 }, data: { label: 'Total Project', est30: 0.5, est70: 0.5, est95: 1 }, type: 'editable' },
  { id: '2', position: { x: 300, y: 0 }, data: { label: 'Feature A', est30: 1, est70: 5, est95: 10 }, type: 'editable' },
]

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    type: 'editable',
    data: { probability: 50 },
    markerEnd: { type: MarkerType.ArrowClosed } 
  },
]

export default function FlowDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const { fitView } = useReactFlow()

  // --- Discrete Percentile Engine ---
  const computedNodes = useMemo(() => {
    const adj = new Map<string, Array<{ to: string, prob: number }>>();
    edges.forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, []);
      const prob = (e.data as EdgeData)?.probability ?? 100;
      adj.get(e.source)!.push({ to: e.target, prob: prob / 100 });
    });

    const memo = new Map<string, StatsEngine.Distribution>();
    const processing = new Set<string>();

    function computeDist(id: string): StatsEngine.Distribution {
      if (memo.has(id)) return memo.get(id)!;
      if (processing.has(id)) return StatsEngine.createConstant(0);
      
      processing.add(id);
      const node = nodes.find(n => n.id === id);
      if (!node) {
        processing.delete(id);
        return StatsEngine.createConstant(0);
      }

      const data = node.data as NodeData;
      // 1. Generate local histogram from user inputs (Project Sugar)
      let currentDist = ProjectStats.generateFromMarks(
        data.est30 ?? 0, 
        data.est70 ?? 0, 
        data.est95 ?? 0
      );

      // 2. Conjoin with each child distribution using pure StatsEngine
      const children = adj.get(id) || [];
      children.forEach(child => {
        const childBaseDist = computeDist(child.to);
        const childEffectiveDist = StatsEngine.applyProbability(childBaseDist, child.prob);
        currentDist = StatsEngine.convolve(currentDist, childEffectiveDist);
      });

      memo.set(id, currentDist);
      processing.delete(id);
      return currentDist;
    }

    return nodes.map(n => {
      const histogram = computeDist(n.id);
      return {
        ...n,
        data: {
          ...n.data,
          histogram
        }
      };
    });
  }, [nodes, edges]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ 
      ...connection, 
      type: 'editable',
      data: { probability: 100 },
      markerEnd: { type: MarkerType.ArrowClosed } 
    }, eds))
  }, [setEdges])

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      )

      setNodes([...layoutedNodes])
      setEdges([...layoutedEdges])

      window.requestAnimationFrame(() => {
        fitView()
      })
    },
    [nodes, edges, setNodes, setEdges, fitView]
  )

  return (
    <div className="h-full w-full overflow-hidden">
      <ReactFlow
        nodes={computedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background gap={12} size={1} />
        <Panel position="top-right" className="bg-white p-2 rounded shadow-md border flex gap-2">
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
        </Panel>
      </ReactFlow>
    </div>
  )
}
