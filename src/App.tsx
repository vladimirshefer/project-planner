import { useQuery } from '@tanstack/react-query'
import FlowDemo from './components/FlowDemo'
import { ReactFlowProvider } from '@xyflow/react'

type Todo = { id: number; title: string }

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export default function App() {
  const { data, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      {/* Header / Overlay */}
      <header className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm pointer-events-auto">
          <h1 className="text-xl font-bold text-gray-800">Planning Assistant</h1>
          <p className="text-xs text-gray-500">Tree-based planning with probabilistic estimates</p>
        </div>
        
        {/* Compact Todo List as a toggleable or overlay element if needed, 
            but for now let's just keep it as a small overlay info */}
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm pointer-events-auto max-w-xs">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Sync Status ({data?.length ?? 0})</h2>
            <span className={`h-2 w-2 rounded-full ${isFetching ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'}`}></span>
          </div>
          <p className="text-[10px] text-gray-400 leading-tight">
            Canvas is now fullscreen. Drag to pan, scroll to zoom. Use the buttons on the right to layout.
          </p>
        </div>
      </header>

      {/* Fullscreen Canvas */}
      <div className="flex-grow relative">
        <ReactFlowProvider>
          <FlowDemo />
        </ReactFlowProvider>
      </div>

      {/* Footer Info */}
      <footer className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <p className="text-[10px] text-gray-400 bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
          React + TypeScript + Tailwind + @xyflow/react
        </p>
      </footer>
    </div>
  )
}
