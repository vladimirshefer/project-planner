import {useCallback, useEffect, useMemo, useState} from 'react'
import {ReactFlowProvider} from '@xyflow/react'
import {useNavigate} from 'react-router-dom'
import FlowDemo from '../../components/FlowDemo'
import {EstimationsGraph} from '../../utils/estimations-graph'
import {projectManager} from '../../utils/project-manager'
import {MissingProjectPage} from '../MissingProjectPage'

export function EditorProjectPage({
  projectId,
  focusNodeId,
}: {
  projectId: string
  focusNodeId: string | null
}) {
  const navigate = useNavigate()
  const loadedProject = useMemo(() => projectManager.getProject(projectId), [projectId])
  const [projectName, setProjectName] = useState<string | null>(loadedProject?.name ?? null)
  const [editorState, setEditorState] = useState<EstimationsGraph.GraphState>(() => loadedProject?.state ?? EstimationsGraph.createInitialState())
  const [editorVersion, setEditorVersion] = useState(0)

  useEffect(() => {
    if (!loadedProject) return
    setProjectName(loadedProject.name)
    setEditorState(loadedProject.state)
    setEditorVersion((v) => v + 1)
  }, [loadedProject])

  function openProjectId(projectId: string) {
    navigate(`/projects/${encodeURIComponent(projectId)}`)
  }

  function onSaveProject(name: string, state: EstimationsGraph.GraphState) {
      const saved = projectManager.saveProject({
          projectId: projectId,
          name,
          state,
      })
      openProjectId(saved.id)
  }

  function onSaveProjectAsNew(name: string, state: EstimationsGraph.GraphState) {
      const saved = projectManager.saveProject({
          name,
          state,
      })
      openProjectId(saved.id)
  }

  function onRenameProject(name: string, state: EstimationsGraph.GraphState) {
      const saved = projectManager.saveProject({
          projectId: projectId,
          name,
          state,
      })
      openProjectId(saved.id)
  }

  if (!loadedProject) {
    return <MissingProjectPage />
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
      <div className="flex-grow relative">
        <ReactFlowProvider>
          <FlowDemo
            key={`${projectId ?? 'draft'}-${editorVersion}`}
            initialState={editorState}
            projectId={projectId}
            projectName={projectName}
            focusNodeId={focusNodeId}
            onSaveProject={(name, project) => onSaveProject(name, project)}
            onSaveProjectAsNew={onSaveProjectAsNew}
            onRenameProject={onRenameProject}
          />
        </ReactFlowProvider>
      </div>
    </div>
  )
}
