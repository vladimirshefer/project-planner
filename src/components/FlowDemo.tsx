import { useCallback, ChangeEvent } from 'react'
import  {
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
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

type NodeData = {
  label: string;
  est30?: number;
  est70?: number;
  est95?: number;
};

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

  return (
    <div className="rounded border bg-white p-3 shadow-md min-w-[150px] flex flex-col gap-2">
      <Handle type="target" position={Position.Top} />
      
      {/* Name/Label */}
      <input
        type="text"
        className="w-full border-b pb-1 text-center font-bold text-sm focus:outline-none focus:ring-0 bg-white"
        defaultValue={data.label}
        onChange={(e) => updateNodeData('label', e.target.value)}
      />

      {/* Estimates */}
      <div className="flex flex-col gap-1 text-[10px] text-gray-500">
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

      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}



const nodeTypes = {
  editable: EditableNode,
}

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 50 }, data: { label: 'Start', est30: 1, est70: 2, est95: 5 }, type: 'editable' },
  { id: '2', position: { x: 300, y: 0 }, data: { label: 'Plan', est30: 2, est70: 4, est95: 8 }, type: 'editable' },
  { id: '3', position: { x: 300, y: 150 }, data: { label: 'Execute', est30: 5, est70: 10, est95: 20 }, type: 'editable' },
]

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e1-3', source: '1', target: '3' },
]

export default function FlowDemo() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true }, eds))
  }, [setEdges])

  return (
    <div className="h-96 w-full overflow-hidden rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  )
}
