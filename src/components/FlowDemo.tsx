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
  estimate: number;
  risk: ProjectStats.RiskLevel;
  limit?: number; // Hard-stop limit
  histogram?: StatsEngine.Distribution;
  successProb?: number; // Probability of completing before hard-stop
};

type EdgeData = {
  probability?: number;
  recovery?: number;
};

// ... Dagre setup and layout code remains same ...

function EditableNode({ id, data }: NodeProps<Node<NodeData>>) {
  const { setNodes } = useReactFlow()

  const updateNodeData = useCallback((key: keyof NodeData, value: string | number | undefined) => {
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

  const riskLevels: ProjectStats.RiskLevel[] = ['low', 'medium', 'high', 'extreme'];

  // Extract sugar for presentation from the histogram
  const totals = useMemo(() => 
    data.histogram ? ProjectStats.extractViewMarks(data.histogram, data.successProb ?? 1) : null,
    [data.histogram, data.successProb]
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
      <div className="flex flex-col gap-3 text-[10px] text-gray-500 pt-1">
        <div className="flex justify-between items-center gap-2">
          <span className="whitespace-nowrap font-semibold">Median Est:</span>
          <input
            type="number"
            className="w-16 border rounded px-1 text-right text-xs focus:ring-1 focus:ring-blue-500 outline-none bg-white"
            defaultValue={data.estimate}
            onChange={(e) => updateNodeData('estimate', parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="flex justify-between items-center gap-2">
          <span className="whitespace-nowrap font-semibold">Hard Stop:</span>
          <input
            type="number"
            placeholder="No limit"
            className="w-16 border rounded px-1 text-right text-xs focus:ring-1 focus:ring-red-500 outline-none placeholder:text-gray-300 bg-white"
            defaultValue={data.limit}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              updateNodeData('limit', isNaN(val) ? undefined : val);
            }}
          />
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="whitespace-nowrap font-semibold uppercase tracking-wider">Risk Level:</span>
            <span className="text-blue-600 font-bold capitalize">{data.risk}</span>
          </div>
          <input
            type="range"
            min="0"
            max="3"
            step="1"
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            value={riskLevels.indexOf(data.risk)}
            onChange={(e) => updateNodeData('risk', riskLevels[parseInt(e.target.value)])}
          />
        </div>
      </div>

      {/* Calculated Rollups (Presentation Sugar) */}
      {totals && (
        <div className="mt-1 border-t pt-2 flex flex-col gap-1 bg-blue-50/50 -mx-3 px-3 pb-2">
          <div className="flex justify-between items-center font-bold text-xs text-blue-700">
            <span>Median (P50):</span>
            <span>{totals.p50.toFixed(1)}</span>
          </div>
          
          {/* Success Probability Indicator */}
          <div className={`flex justify-between items-center text-[10px] font-bold px-1 py-0.5 rounded ${totals.successProb < 0.9 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            <span>SUCCESS CHANCE:</span>
            <span>{(totals.successProb * 100).toFixed(1)}%</span>
          </div>

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

  const updateEdgeData = useCallback(
    (key: keyof EdgeData, val: number) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
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
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="bg-white p-1 rounded border border-blue-200 shadow-md flex flex-col gap-1 text-[8px] min-w-[60px]"
        >
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

const STORAGE_KEY = 'planning-assistant-graph-v1';

const initialNodes: Node<NodeData>[] = [
  { id: '1', position: { x: 0, y: 50 }, data: { label: 'Total Project', estimate: 0, risk: 'low' }, type: 'editable' },
  { id: '2', position: { x: 300, y: 0 }, data: { label: 'Feature A', estimate: 5, risk: 'medium' }, type: 'editable' },
]

const initialEdges: Edge[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    type: 'editable',
    data: { probability: 100 },
    markerEnd: { type: MarkerType.ArrowClosed } 
  },
]

export default function FlowDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).nodes || initialNodes;
      } catch (e) {
        console.error('Failed to parse saved nodes', e);
      }
    }
    return initialNodes;
  })

  const [edges, setEdges, onEdgesChange] = useEdgesState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).edges || initialEdges;
      } catch (e) {
        console.error('Failed to parse saved edges', e);
      }
    }
    return initialEdges;
  })

  const { fitView } = useReactFlow()

  // --- Persistence ---
  useMemo(() => {
    const state = { nodes, edges };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [nodes, edges]);

  // --- Discrete Percentile Engine ---
  const computedNodes = useMemo(() => {
    const adj = new Map<string, Array<{ to: string, prob: number, recovery: number }>>();
    edges.forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, []);
      const prob = (e.data as EdgeData)?.probability ?? 100;
      const recovery = (e.data as EdgeData)?.recovery ?? 0;
      adj.get(e.source)!.push({ to: e.target, prob: prob / 100, recovery: recovery / 100 });
    });

    const memo = new Map<string, { dist: StatsEngine.Distribution, successProb: number }>();
    const processing = new Set<string>();

    function computeDist(id: string): { dist: StatsEngine.Distribution, successProb: number } {
      if (memo.has(id)) return memo.get(id)!;
      if (processing.has(id)) return { dist: StatsEngine.createConstant(0), successProb: 1 };
      
      processing.add(id);
      const node = nodes.find(n => n.id === id);
      if (!node) {
        processing.delete(id);
        return { dist: StatsEngine.createConstant(0), successProb: 1 };
      }

      const data = node.data;
      // 1. Generate local histogram from user inputs
      let currentDist = ProjectStats.generateFromMedianAndRisk(
        data.estimate ?? 0, 
        data.risk ?? 'low'
      );

      let successProb = 1.0;

      // 2. Conjoin with each child distribution
      const children = adj.get(id) || [];
      children.forEach(child => {
        const childResult = computeDist(child.to);
        
        // Probability gating from the edge
        const childEffectiveDist = StatsEngine.applyProbability(childResult.dist, child.prob);
        
        // Success probability propagates with recovery chance:
        // P(Success) = P(Child Not Needed) + P(Child Needed) * [P(Child Success) + P(Child Fail) * P(Recovery)]
        const childEffectiveSuccess = childResult.successProb + (1 - childResult.successProb) * child.recovery;
        const childContributionToSuccess = (1 - child.prob) + (child.prob * childEffectiveSuccess);
        
        successProb *= childContributionToSuccess;

        currentDist = StatsEngine.convolve(currentDist, childEffectiveDist);
      });

      // 3. Apply local hard-stop limit
      if (data.limit !== undefined && data.limit !== null) {
        const localSuccessProb = StatsEngine.getProbabilityOfLimit(currentDist, data.limit);
        successProb *= localSuccessProb;
      }

      const result = { dist: currentDist, successProb };
      memo.set(id, result);
      processing.delete(id);
      return result;
    }

    return nodes.map(n => {
      const result = computeDist(n.id);
      return {
        ...n,
        data: {
          ...n.data,
          histogram: result.dist,
          successProb: result.successProb
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

  const onClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the entire project?')) {
      localStorage.removeItem(STORAGE_KEY);
      setNodes([]);
      setEdges([]);
    }
  }, [setNodes, setEdges]);

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
          <button
            onClick={onClear}
            className="px-3 py-1 border border-red-200 text-red-500 rounded text-xs font-semibold hover:bg-red-50 transition-colors"
          >
            Clear
          </button>
        </Panel>
      </ReactFlow>
    </div>
  )
}

