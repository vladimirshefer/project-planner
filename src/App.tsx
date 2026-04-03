import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import FlowDemo from './components/FlowDemo'
import { LandingPage } from './pages/LandingPage'
import { LandingPageV2 } from './pages/LandingPageV2'
import { TimelineView } from './components/TimelineView'
import { WorkerPoolEditor } from './components/WorkerPoolEditor'
import { EstimationsGraph } from './utils/estimations-graph'
import { SampleProject } from './utils/sample-project'
import { collectKnownSkills } from './utils/skills'
import { useClickOutside } from './utils/use-click-outside'

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

  const openProject = useCallback((saved: EstimationsGraph.SavedProject) => {
    setActiveProjectId(saved.id)
    setActiveProjectName(saved.name)
    navigate(`/projects/${saved.id}`, { replace: true })
  }, [navigate])

  const onSaveProject = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    const saved = EstimationsGraph.saveProject({
      id: activeProjectId ?? undefined,
      name,
      state,
    })
    openProject(saved)
  }, [activeProjectId, openProject])

  const onSaveProjectAsNew = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    const saved = EstimationsGraph.saveProject({
      name,
      state,
    })
    openProject(saved)
  }, [openProject])

  const onRenameProject = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    if (!activeProjectId) return
    const saved = EstimationsGraph.saveProject({
      id: activeProjectId,
      name,
      state,
    })
    openProject(saved)
  }, [activeProjectId, openProject])

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
            isSavedProject={Boolean(activeProjectId)}
            focusNodeId={focusNodeId}
            onSaveProject={onSaveProject}
            onSaveProjectAsNew={onSaveProjectAsNew}
            onRenameProject={onRenameProject}
            onOpenProjects={() => navigate('/projects')}
            onOpenWorkers={() => navigate(activeProjectId ? `/projects/${activeProjectId}/workers` : '/projects/new/workers')}
            onOpenTimeline={() => navigate(activeProjectId ? `/projects/${activeProjectId}/timeline` : '/projects/new/timeline')}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}

function ProjectsPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [projectsMenuOpen, setProjectsMenuOpen] = useState(false)
  const projectsMenuRef = useRef<HTMLDivElement | null>(null)
  const projects = useMemo(() => EstimationsGraph.listProjects(), [])

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((project) => project.name.toLowerCase().includes(q) || project.tickets.some((ticket) => ticket.toLowerCase().includes(q)))
  }, [projects, search])

  const onStartFreshProject = useCallback(() => {
    setProjectsMenuOpen(false)
    EstimationsGraph.archiveDraftProject()
    EstimationsGraph.clearStorage()
    navigate('/projects/new')
  }, [navigate])

  useClickOutside(projectsMenuRef, projectsMenuOpen, () => setProjectsMenuOpen(false))

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
          <div className="relative" ref={projectsMenuRef}>
            <div className="flex items-stretch">
              <button
                onClick={() => {
                  setProjectsMenuOpen(false)
                  navigate('/projects/new')
                }}
                className="px-3 py-1.5 text-sm font-semibold rounded-l bg-emerald-600 text-white hover:bg-emerald-700"
              >
                New Project
              </button>
              <button
                type="button"
                onClick={() => setProjectsMenuOpen((value) => !value)}
                className="px-2 py-1.5 text-sm font-semibold rounded-r border-l border-emerald-500 bg-emerald-600 text-white hover:bg-emerald-700"
                aria-label="Open new project options"
              >
                ▾
              </button>
            </div>

            {projectsMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded border bg-white shadow-lg z-10 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    setProjectsMenuOpen(false)
                    onStartFreshProject()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Start fresh project
                </button>
              </div>
            )}
          </div>
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
  const isDraft = projectId === 'new'
  const initialProject = useMemo(() => {
    if (isDraft) return null
    return EstimationsGraph.getProjectById(projectId)
  }, [isDraft, projectId])
  const [project, setProject] = useState(initialProject)
  const [draftState, setDraftState] = useState<EstimationsGraph.GraphState>(() => (
    isDraft ? EstimationsGraph.loadFromStorage() : EstimationsGraph.createInitialState()
  ))

  useEffect(() => {
    setProject(initialProject)
  }, [initialProject])

  useEffect(() => {
    if (!isDraft) return
    setDraftState(EstimationsGraph.loadFromStorage())
  }, [isDraft])

  if (!isDraft && !project) return <MissingProject />

  const state = isDraft ? draftState : project!.state
  const projectName = isDraft ? 'Unsaved Draft' : project!.name

  const onWorkersChange = (workers: EstimationsGraph.WorkerDto[]) => {
    const validIds = new Set(workers.map((worker) => worker.id))
    const nextNodes = state.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        assigneeIds: (node.data.assigneeIds ?? []).filter((id) => validIds.has(id)),
      },
    }))

    const nextState: EstimationsGraph.GraphState = {
      ...state,
      workers,
      nodes: nextNodes,
    }

    if (isDraft) {
      EstimationsGraph.saveToStorage(nextState)
      setDraftState(nextState)
      return
    }

    const saved = EstimationsGraph.saveProject({ id: project!.id, name: project!.name, state: nextState })
    setProject(saved)
  }

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Workers: {projectName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(isDraft ? '/projects/new/timeline' : `/projects/${project!.id}/timeline`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Timeline
            </button>
            <button
              onClick={() => navigate(isDraft ? '/projects/new' : `/projects/${project!.id}`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <WorkerPoolEditor
          workers={state.workers ?? []}
          suggestions={collectKnownSkills(state)}
          onChange={onWorkersChange}
        />
      </div>
    </div>
  )
}

function TimelinePage() {
  const navigate = useNavigate()
  const { projectId = '' } = useParams()
  const isDraft = projectId === 'new'
  const project = useMemo(() => {
    if (isDraft) return null
    return EstimationsGraph.getProjectById(projectId)
  }, [isDraft, projectId])
  const state = useMemo(() => (
    isDraft ? EstimationsGraph.loadFromStorage() : project?.state ?? null
  ), [isDraft, project])

  if (!isDraft && !project) return <MissingProject />
  if (!state) return <MissingProject />

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Timeline: {isDraft ? 'Unsaved Draft' : project!.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(isDraft ? '/projects/new/workers' : `/projects/${project!.id}/workers`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Workers
            </button>
            <button
              onClick={() => navigate(isDraft ? '/projects/new' : `/projects/${project!.id}`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <TimelineView
          state={state}
          onTaskClick={(nodeId) => navigate(isDraft ? `/projects/new?focusNodeId=${nodeId}` : `/projects/${project!.id}?focusNodeId=${nodeId}`)}
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
      <Route path="/" element={<LandingPageV2 />} />
      <Route path="/landing-v1" element={<LandingPage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<EditorPage />} />
      <Route path="/projects/new/workers" element={<WorkersPage />} />
      <Route path="/projects/new/timeline" element={<TimelinePage />} />
      <Route path="/projects/:projectId" element={<EditorPage />} />
      <Route path="/projects/:projectId/workers" element={<WorkersPage />} />
      <Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
    </Routes>
  )
}
