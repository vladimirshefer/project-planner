import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TimelineView } from '../../components/TimelineView'
import { projectManager } from '../../utils/project-manager'
import { MissingProjectPage } from '../MissingProjectPage'
import { decodeProjectIdParam } from '../project-routes'

export function TimelinePage() {
  const navigate = useNavigate()
  const { projectId: projectIdParam } = useParams<{ projectId: string }>()
  const projectId = useMemo(() => decodeProjectIdParam(projectIdParam), [projectIdParam])
  const project = useMemo(() => projectId ? projectManager.getProject(projectId) : null, [projectId])
  const state = useMemo(() => project?.state ?? null, [project])

  if (!projectId || !project) return <MissingProjectPage />
  if (!state) return <MissingProjectPage />

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Timeline: {project.name}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}/workers`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-cyan-600 text-white hover:bg-cyan-700"
            >
              Workers
            </button>
            <button
              onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white hover:bg-gray-900"
            >
              Back to Editor
            </button>
          </div>
        </div>

        <TimelineView
          state={state}
          onTaskClick={(nodeId) => navigate(`/projects/${encodeURIComponent(project.id)}?${new URLSearchParams({ focusNodeId: nodeId }).toString()}`)}
        />
      </div>
    </div>
  )
}
