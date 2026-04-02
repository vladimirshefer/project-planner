import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import FlowDemo from './components/FlowDemo'
import { LandingPage } from './pages/LandingPage'
import { TimelineView } from './components/TimelineView'
import { WorkerPoolEditor } from './components/WorkerPoolEditor'
import { EstimationsGraph } from './utils/estimations-graph'
import { SampleProject } from './utils/sample-project'
import { collectKnownSkills } from './utils/skills'

function EditorPage() {
  const navigate = useNavigate()
  const { projectId = 'new' } = useParams()
  const [searchParams] = useSearchParams()
  const focusNodeId = searchParams.get('focusNodeId')
  const template = searchParams.get('template')

  const isNew = projectId === 'new'
  const loadedProject = useMemo(() => {
    if (isNew) return null
    return EstimationsGraph.getProjectById(projectId)
  }, [isNew, projectId])

  const createDraftState = useCallback(() => {
    if (template === 'sample') return SampleProject.createState()
    return EstimationsGraph.loadFromStorage()
  }, [template])

  const draftProjectName = template === 'sample' ? 'Sample Draft' : null

  const [activeProjectId, setActiveProjectId] = useState<string | null>(loadedProject?.id ?? null)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(loadedProject?.name ?? draftProjectName)
  const [editorState, setEditorState] = useState<EstimationsGraph.GraphState>(() => loadedProject?.state ?? createDraftState())
  const [editorVersion, setEditorVersion] = useState(0)

  useEffect(() => {
    if (isNew) {
      setActiveProjectId(null)
      setActiveProjectName(draftProjectName)
      setEditorState(createDraftState())
      setEditorVersion((v) => v + 1)
      return
    }
    if (!loadedProject) return
    setActiveProjectId(loadedProject.id)
    setActiveProjectName(loadedProject.name)
    setEditorState(loadedProject.state)
    setEditorVersion((v) => v + 1)
  }, [createDraftState, draftProjectName, isNew, loadedProject])

  const onSaveProject = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    const saved = EstimationsGraph.saveProject({
      id: activeProjectId ?? undefined,
      name,
      state,
    })
    setActiveProjectId(saved.id)
    setActiveProjectName(saved.name)
    navigate(`/projects/${saved.id}`, { replace: true })
  }, [activeProjectId, navigate])

  if (!isNew && !loadedProject) {
    return (
      <MissingProject />
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <header className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg border shadow-sm pointer-events-auto">
          <h1 className="text-xl font-bold text-gray-800">Planning Assistant</h1>
          <p className="text-xs text-gray-500">Tree-based planning with probabilistic estimates</p>
          <p className="text-[10px] text-gray-500 mt-1">Active project: {activeProjectName ?? 'Unsaved Draft'}</p>
        </div>
      </header>

      <div className="flex-grow relative">
        <ReactFlowProvider>
          <FlowDemo
            key={`${activeProjectId ?? 'draft'}-${editorVersion}`}
            initialState={editorState}
            activeProjectName={activeProjectName}
            focusNodeId={focusNodeId}
            onSaveProject={onSaveProject}
            onOpenProjects={() => navigate('/projects')}
            onOpenWorkers={activeProjectId ? () => navigate(`/projects/${activeProjectId}/workers`) : undefined}
            onOpenTimeline={activeProjectId ? () => navigate(`/projects/${activeProjectId}/timeline`) : undefined}
          />
        </ReactFlowProvider>
      </div>
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
    return projects.filter((project) => project.name.toLowerCase().includes(q) || project.tickets.some((ticket) => ticket.toLowerCase().includes(q)))
  }, [projects, search])

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <button
            onClick={() => navigate('/projects/new')}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >
            New Project
          </button>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by project name or ticket name"
          className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />

        <div className="flex flex-col gap-3">
          {filteredProjects.length === 0 && (
            <div className="bg-white border rounded p-4 text-sm text-gray-500">No projects found.</div>
          )}

          {filteredProjects.map((project) => (
            <div key={project.id} className="bg-white border rounded p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-800 truncate">{project.name}</h2>
                <p className="text-xs text-gray-500">Updated: {new Date(project.updatedAt).toLocaleString()}</p>
                <p className="text-xs text-gray-500 truncate">Tickets: {project.tickets.slice(0, 6).join(', ') || 'None'}</p>
              </div>
              <button
                onClick={() => navigate(`/projects/${project.id}`)}
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

function WorkersPage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const initialProject = useMemo(() => EstimationsGraph.getProjectById(projectId), [projectId])
  const [project, setProject] = useState(initialProject)

  useEffect(() => {
    setProject(initialProject)
  }, [initialProject])

  if (!project) return <MissingProject />

  const onWorkersChange = (workers: EstimationsGraph.WorkerDto[]) => {
    const validIds = new Set(workers.map((worker) => worker.id))
    const nextNodes = project.state.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        assigneeIds: (node.data.assigneeIds ?? []).filter((id) => validIds.has(id)),
      },
    }))

    const nextState: EstimationsGraph.GraphState = {
      ...project.state,
      workers,
      nodes: nextNodes,
    }

    const saved = EstimationsGraph.saveProject({ id: project.id, name: project.name, state: nextState })
    setProject(saved)
  }

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Workers: {project.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects/${project.id}/timeline`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Timeline
            </button>
            <button
              onClick={() => navigate(`/projects/${project.id}`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <WorkerPoolEditor
          workers={project.state.workers ?? []}
          suggestions={collectKnownSkills(project.state)}
          onChange={onWorkersChange}
        />
      </div>
    </div>
  )
}

function TimelinePage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const project = useMemo(() => EstimationsGraph.getProjectById(projectId), [projectId])

  if (!project) return <MissingProject />

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Timeline: {project.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects/${project.id}/workers`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Workers
            </button>
            <button
              onClick={() => navigate(`/projects/${project.id}`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <TimelineView
          state={project.state}
          onTaskClick={(nodeId) => navigate(`/projects/${project.id}?focusNodeId=${nodeId}`)}
        />
      </div>
    </div>
  )
}

function MissingProject() {
  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border rounded p-6 text-sm text-gray-600 flex flex-col gap-3">
        <p>Project not found.</p>
        <Link to="/projects" className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white text-center">
          Back to Projects
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<EditorPage />} />
      <Route path="/projects/:projectId" element={<EditorPage />} />
      <Route path="/projects/:projectId/workers" element={<WorkersPage />} />
      <Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
    </Routes>
  )
}
