import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WorkerPoolEditor } from '../../components/WorkerPoolEditor'
import { EstimationsGraph } from '../../utils/estimations-graph'
import { projectManager } from '../../utils/project-manager'
import { collectKnownSkills } from '../../utils/skills'
import { MissingProjectPage } from '../MissingProjectPage'

export function WorkersPage({
  projectId,
}: {
  projectId: string
}) {
  const navigate = useNavigate()
  const initialProject = useMemo(() => projectManager.getProject(projectId), [projectId])
  const [project, setProject] = useState(initialProject)

  useEffect(() => {
    setProject(initialProject)
  }, [initialProject])

  if (!project) return <MissingProjectPage />

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

    const saved = projectManager.saveProject({ projectId: project.id, name: project.name, state: nextState })
    setProject(saved)
  }

  return (
    <div className="h-screen w-screen bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Workers: {projectName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}/timeline`)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-fuchsia-600 text-white hover:bg-fuchsia-700"
            >
              Timeline
            </button>
            <button
              onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}`)}
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
