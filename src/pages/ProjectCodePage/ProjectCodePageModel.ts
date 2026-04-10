import { EstimationsGraph } from '../../utils/estimations-graph'
import { ProjectManager } from '../../utils/project-manager'

export namespace ProjectCodePageModel {
  export type ApplyResult =
    | {
        ok: true
        report: EstimationsGraph.ImportReport
        savedProject: ProjectManager.Project
      }
    | {
        ok: false
        error: string
      }

  export function toEditorText(state: EstimationsGraph.GraphState): string {
    return EstimationsGraph.serializeText(state)
  }

  export function applyText({
    projectId,
    projectName,
    rawText,
    saveProject,
  }: {
    projectId: string
    projectName: string
    rawText: string
    saveProject: (input: ProjectManager.SaveProjectInput) => ProjectManager.Project
  }): ApplyResult {
    try {
      const result = EstimationsGraph.deserializeText(rawText)
      const savedProject = saveProject({
        projectId,
        name: projectName,
        state: result.state,
      })
      return {
        ok: true,
        report: result.report,
        savedProject,
      }
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Invalid YAML.',
      }
    }
  }
}
