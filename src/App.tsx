import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { Link, Route, Routes, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import FlowDemo from './components/FlowDemo'
import { LandingPage } from './pages/LandingPage'
import { LandingPageV2 } from './pages/LandingPageV2'
import { TimelineView } from './components/TimelineView'
import { WorkerPoolEditor } from './components/WorkerPoolEditor'
import { EstimationsGraph } from './utils/estimations-graph'
import { projectManager } from './utils/project-manager'
import type { ProjectManager } from './utils/project-manager'
import { decodeSharePayload, isShareSupported, SHARE_QUERY_PARAM } from './utils/share-url'
import { SampleProject } from './utils/sample-project'
import { collectKnownSkills } from './utils/skills'
import { useClickOutside } from './utils/use-click-outside'

function getProjectPath(projectId: string, section?: 'workers' | 'timeline', query?: URLSearchParams): string {
  const basePath = `/projects/${projectId}`
  const withSection = section ? `${basePath}/${section}` : basePath
  const queryString = query?.toString()
  return queryString ? `${withSection}?${queryString}` : withSection
}

function useProjectRouteParam(): string {
  const { pathname } = useLocation()
  const projectPath = pathname.replace(/^\/projects\//, '')
  return projectPath.replace(/\/(workers|timeline)$/, '')
}

function useProjectRouteSection(): 'editor' | 'workers' | 'timeline' {
  const { pathname } = useLocation()
  const projectPath = pathname.replace(/^\/projects\//, '')
  if (projectPath.endsWith('/workers')) return 'workers'
  if (projectPath.endsWith('/timeline')) return 'timeline'
  return 'editor'
}

function ProjectRoute() {
  const section = useProjectRouteSection()

  if (section === 'workers') return <WorkersPage />
  if (section === 'timeline') return <TimelinePage />
  return <EditorPage />
}

function NewProjectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const template = searchParams.get('template')
  const hasCreatedDraftRef = useRef(false)

  useEffect(() => {
    if (hasCreatedDraftRef.current) return
    hasCreatedDraftRef.current = true
    const saved = projectManager.createDraftProject(
      template === 'sample' ? SampleProject.createState() : undefined
    )
    navigate(getProjectPath(saved.id), { replace: true })
  }, [navigate, template])

  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border rounded p-6 text-sm text-gray-600">Creating draft...</div>
    </div>
  )
}

function EditorPage() {
  const navigate = useNavigate()
  const projectId = useProjectRouteParam()
  const [searchParams] = useSearchParams()
  const focusNodeId = searchParams.get('focusNodeId')
  const loadedProject = useMemo(() => projectManager.getProject(projectId), [projectId])

  const [activeProjectId, setActiveProjectId] = useState<string | null>(loadedProject?.id ?? null)
  const [activeProjectName, setActiveProjectName] = useState<string | null>(loadedProject?.name ?? null)
  const [editorState, setEditorState] = useState<EstimationsGraph.GraphState>(() => loadedProject?.state ?? EstimationsGraph.createInitialState())
  const [editorVersion, setEditorVersion] = useState(0)

  useEffect(() => {
    if (!loadedProject) return
    setActiveProjectId(loadedProject.id)
    setActiveProjectName(loadedProject.name)
    setEditorState(loadedProject.state)
    setEditorVersion((v) => v + 1)
  }, [loadedProject])

  const openProject = useCallback((saved: ProjectManager.Project) => {
    setActiveProjectId(saved.id)
    setActiveProjectName(saved.name)
    navigate(getProjectPath(saved.id), { replace: true })
  }, [navigate])

  const onSaveProject = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    const saved = projectManager.saveProject({
      projectId: activeProjectId ?? undefined,
      name,
      state,
    })
    openProject(saved)
  }, [activeProjectId, openProject])

  const onSaveProjectAsNew = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    const saved = projectManager.saveProject({
      name,
      state,
    })
    openProject(saved)
  }, [openProject])

  const onRenameProject = useCallback((name: string, state: EstimationsGraph.GraphState) => {
    if (!activeProjectId) return
    const saved = projectManager.saveProject({
      projectId: activeProjectId,
      name,
      state,
    })
    openProject(saved)
  }, [activeProjectId, openProject])

  if (!loadedProject) {
    return (
      <MissingProject />
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-grow relative">
        <ReactFlowProvider>
          <FlowDemo
            key={`${activeProjectId ?? 'draft'}-${editorVersion}`}
            initialState={editorState}
            activeProjectId={activeProjectId}
            activeProjectName={activeProjectName}
            focusNodeId={focusNodeId}
            onSaveProject={onSaveProject}
            onSaveProjectAsNew={onSaveProjectAsNew}
            onRenameProject={onRenameProject}
            onOpenProjects={() => navigate('/projects')}
            onOpenWorkers={() => activeProjectId && navigate(getProjectPath(activeProjectId, 'workers'))}
            onOpenTimeline={() => activeProjectId && navigate(getProjectPath(activeProjectId, 'timeline'))}
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
  const projects = useMemo(() => projectManager.getProjects(), [])

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((project) => project.name.toLowerCase().includes(q) || project.tickets.some((ticket) => ticket.toLowerCase().includes(q)))
  }, [projects, search])

  const onStartFreshProject = useCallback(() => {
    setProjectsMenuOpen(false)
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
                onClick={() => navigate(getProjectPath(project.id))}
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
  const projectId = useProjectRouteParam()
  const initialProject = useMemo(() => projectManager.getProject(projectId), [projectId])
  const [project, setProject] = useState(initialProject)

  useEffect(() => {
    setProject(initialProject)
  }, [initialProject])

  if (!project) return <MissingProject />

  const state = project.state
  const projectName = project.name

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

    const saved = projectManager.saveProject({ projectId: project!.id, name: project!.name, state: nextState })
    setProject(saved)
  }

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Workers: {projectName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(getProjectPath(project!.id, 'timeline'))}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Timeline
            </button>
            <button
              onClick={() => navigate(getProjectPath(project!.id))}
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
  const projectId = useProjectRouteParam()
  const project = useMemo(() => projectManager.getProject(projectId), [projectId])
  const state = useMemo(() => project?.state ?? null, [project])

  if (!project) return <MissingProject />
  if (!state) return <MissingProject />

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Timeline: {project.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(getProjectPath(project!.id, 'workers'))}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Workers
            </button>
            <button
              onClick={() => navigate(getProjectPath(project!.id))}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <TimelineView
          state={state}
          onTaskClick={(nodeId) => navigate(getProjectPath(project!.id, undefined, new URLSearchParams({ focusNodeId: nodeId })))}
        />
      </div>
    </div>
  )
}

function SharePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const payload = searchParams.get(SHARE_QUERY_PARAM)?.trim() ?? ''
  const [importResult, setImportResult] = useState<EstimationsGraph.TextImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!payload) {
      setImportResult(null)
      setImportError('Missing share data.')
      setIsImporting(false)
      return
    }

    if (!isShareSupported()) {
      setImportResult(null)
      setImportError('Share links are not supported in this browser.')
      setIsImporting(false)
      return
    }

    setImportResult(null)
    setImportError('')
    setIsImporting(true)

    decodeSharePayload(payload)
      .then((result) => {
        if (cancelled) return
        setImportResult(result)
      })
      .catch((error) => {
        if (cancelled) return
        setImportError(error instanceof Error ? error.message : 'Failed to import share link.')
      })
      .finally(() => {
        if (cancelled) return
        setIsImporting(false)
      })

    return () => {
      cancelled = true
    }
  }, [payload])

  const onCreateDraft = useCallback(() => {
    if (!importResult) return
    const saved = projectManager.createDraftProject(importResult.state)
    navigate(getProjectPath(saved.id))
  }, [importResult, navigate])

  return (
    <div className="min-h-screen w-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Import Shared Project</h1>
            <p className="text-sm text-gray-500">Create a new local draft from this share link.</p>
          </div>
          <Link to="/projects" className="rounded border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Projects
          </Link>
        </div>

        {isImporting && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Decoding shared project...
          </div>
        )}

        {!isImporting && importError && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {importError}
          </div>
        )}

        {!isImporting && importResult && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Items</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.nodes.length}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Relations</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.edges.length}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Workers</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.workers.length}</p>
              </div>
            </div>

            {importResult.report.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Import warnings: {importResult.report.warnings.length}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Link to="/projects" className="rounded border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="button"
                onClick={onCreateDraft}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Create Draft
              </button>
            </div>
          </>
        )}
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
      <Route path="/share" element={<SharePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<NewProjectPage />} />
      <Route path="/projects/*" element={<ProjectRoute />} />
    </Routes>
  )
}
