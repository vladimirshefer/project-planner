import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Link, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom'
import FlowDemo from './components/FlowDemo'
import { EstimationsGraph } from './utils/estimations-graph'

function EditorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const projectIdFromUrl = searchParams.get('projectId')

  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null)
  const [editorState, setEditorState] = useState<EstimationsGraph.GraphState>(() => EstimationsGraph.loadFromStorage())
  const [editorVersion, setEditorVersion] = useState(0)

  useEffect(() => {
    if (!projectIdFromUrl || projectIdFromUrl === activeProjectId) return
    const project = EstimationsGraph.getProjectById(projectIdFromUrl)
    if (!project) return
    setActiveProjectId(project.id)
    setActiveProjectName(project.name)
    setEditorState(project.state)
    setEditorVersion((v) => v + 1)
  }, [projectIdFromUrl, activeProjectId])

  const onSaveProject = useCallback(
    (name: string, state: EstimationsGraph.GraphState) => {
      const saved = EstimationsGraph.saveProject({
        id: activeProjectId ?? undefined,
        name,
        state,
      })
      setActiveProjectId(saved.id)
      setActiveProjectName(saved.name)
      navigate(`/?projectId=${saved.id}`, { replace: true })
    },
    [activeProjectId, navigate]
  )

  const onOpenProjects = useCallback(() => {
    navigate('/projects')
  }, [navigate])

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm pointer-events-auto">
          <h1 className="text-xl font-bold text-gray-800">Planning Assistant</h1>
          <p className="text-xs text-gray-500">Tree-based planning with probabilistic estimates</p>
          <p className="text-[10px] text-gray-500 mt-1">
            Active project: {activeProjectName ?? 'Unsaved Draft'}
          </p>
        </div>
      </header>

      <div className="flex-grow relative">
        <ReactFlowProvider>
          <FlowDemo
            key={`${activeProjectId ?? 'draft'}-${editorVersion}`}
            initialState={editorState}
            activeProjectName={activeProjectName}
            onSaveProject={onSaveProject}
            onOpenProjects={onOpenProjects}
          />
        </ReactFlowProvider>
      </div>

      <footer className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <p className="text-[10px] text-gray-400 bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
          React + TypeScript + Tailwind + @xyflow/react
        </p>
      </footer>
    </div>
  )
}

function ProjectsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const projects = useMemo(() => EstimationsGraph.listProjects(), [])

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects

    return projects.filter((project) => {
      if (project.name.toLowerCase().includes(q)) return true
      return project.tickets.some((ticket) => ticket.toLowerCase().includes(q))
    })
  }, [projects, search])

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <Link
            to="/"
            className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
          >
            Back to Editor
          </Link>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name or ticket name"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        <div className="flex flex-col gap-3">
          {filteredProjects.length === 0 && (
            <div className="bg-white border rounded p-4 text-sm text-gray-500">
              No projects found.
            </div>
          )}

          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border rounded p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-800 truncate">{project.name}</h2>
                <p className="text-xs text-gray-500">
                  Updated: {new Date(project.updatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Tickets: {project.tickets.slice(0, 6).join(', ') || 'None'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/?projectId=${project.id}`)}
                className="px-3 py-1.5 text-sm font-semibold rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                Open
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EditorPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
    </Routes>
  )
}
