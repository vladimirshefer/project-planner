import { useQuery } from '@tanstack/react-query'
import FlowDemo from './components/FlowDemo'

type Todo = { id: number; title: string }

async function fetchTodos(): Promise<Todo[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5')
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json()
}

export default function App() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  })

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Planning Assistant</h1>

      <section className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Sample Todos (React Query)</h2>
          <button
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {isLoading && <p className="text-gray-600">Loading…</p>}
        {isError && (
          <p className="text-red-600">{(error as Error)?.message ?? 'Unknown error'}</p>
        )}
        {data && (
          <ul className="list-disc space-y-1 pl-6">
            {data.map((t) => (
              <li key={t.id}>{t.title}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">React Flow Demo</h2>
          <span className="text-xs text-gray-500">drag nodes, connect them</span>
        </div>
        <FlowDemo />
      </section>

      <p className="mt-8 text-sm text-gray-500">
        Tech stack: React + TypeScript + Vite + Tailwind CSS + @tanstack/react-query + @xyflow/react
      </p>
    </main>
  )
}
