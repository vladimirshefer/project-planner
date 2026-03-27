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

function EditableNode({ id, data }: NodeProps<Node<{ label: string }>>) {
  const { setNodes } = useReactFlow()

  const onChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
    const newLabel = evt.target.value
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              label: newLabel,
            },
          }
        }
        return node
      })
    )
  }, [id, setNodes])

  return (
    <div className="rounded border bg-white p-2 shadow-sm min-w-24">
      <Handle type="target" position={Position.Top} />
      <input
        type="text"
        className="w-full border-none p-0 text-center text-sm focus:outline-none focus:ring-0 bg-white"
        defaultValue={data.label}
        onChange={onChange}
      />
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
}



const nodeTypes = {
  editable: EditableNode,
}

const initialNodes: Node[] = [
  { id: '1', position: { x: 0, y: 50 }, data: { label: 'Start' }, type: 'editable' },
  { id: '2', position: { x: 200, y: 0 }, data: { label: 'Plan' }, type: 'editable' },
  { id: '3', position: { x: 200, y: 120 }, data: { label: 'Execute' }, type: 'editable' },
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
