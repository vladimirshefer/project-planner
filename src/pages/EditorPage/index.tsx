import { useCallback, useEffect, useMemo, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import FlowDemo from '../../components/FlowDemo'
import { EstimationsGraph } from '../../utils/estimations-graph'
import { projectManager } from '../../utils/project-manager'
import type { ProjectManager } from '../../utils/project-manager'
import { MissingProjectPage } from '../MissingProjectPage'
import { decodeProjectIdParam } from '../project-routes'

export function EditorProjectPage() {
  const navigate = useNavigate()
  const { projectId: projectIdParam } = useParams<{ projectId: string }>()
  const [searchParams] = useSearchParams()
  const focusNodeId = searchParams.get('focusNodeId')
  const projectId = useMemo(() => decodeProjectIdParam(projectIdParam), [projectIdParam])
  const loadedProject = useMemo(() => projectId ? projectManager.getProject(projectId) : null, [projectId])

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
    navigate(`/projects/${encodeURIComponent(saved.id)}`, { replace: true })
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

  if (!projectId || !loadedProject) {
    return <MissingProjectPage />
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
            onOpenWorkers={() => activeProjectId && navigate(`/projects/${encodeURIComponent(activeProjectId)}/workers`)}
            onOpenTimeline={() => activeProjectId && navigate(`/projects/${encodeURIComponent(activeProjectId)}/timeline`)}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
