import { EstimationsGraph } from './estimations-graph'

const PROJECTS_STORAGE_KEY = 'planning-assistant-projects-v1'

export namespace ProjectManager {
  /** Persisted graph state stored on a normal saved project. */
  export type ProjectState = EstimationsGraph.GraphState

  /** Saved project record. Drafts are regular projects whose id starts with `draft/`. */
  export type Project = EstimationsGraph.SavedProject

  export type SaveProjectInput = {
    projectId?: string
    name: string
    state: ProjectState
  }

  /**
   * Single app-facing persistence API for normal saved projects.
   * `/projects/new` is only a draft creation entrypoint.
   * `getProjects()` returns every saved project, including `draft/...` projects.
   */
  export interface ProjectManager {
    /** Returns all saved projects, including `draft/...` projects. */
    getProjects(): Project[]

    /** Returns one saved project by id, including slash-delimited virtual folder ids such as `work/project-1`. */
    getProject(projectId: string): Project | null

    /** Creates a new project when `projectId` is missing, or updates the existing project when it is provided. */
    saveProject(input: SaveProjectInput): Project

    /** Creates a normal saved draft project with id/name `draft/yyyy_mm_dd_hh_mm`. */
    createDraftProject(initialState?: ProjectState): Project
  }
}

export function createLocalStorageProjectManager(storage: Storage = localStorage): ProjectManager.ProjectManager {
  const getProjects = (): ProjectManager.Project[] => {
    const raw = storage.getItem(PROJECTS_STORAGE_KEY)
    if (!raw) return []

    try {
      const parsed = JSON.parse(raw) as ProjectManager.Project[]
      if (!Array.isArray(parsed)) return []

      return parsed
        .map((project) => ({
          ...project,
          state: EstimationsGraph.normalizeGraphState(project.state),
        }))
        .filter((project) => project.name)
    } catch {
      return []
    }
  }

  const saveProjects = (projects: ProjectManager.Project[]) => {
    storage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects))
  }

  const saveProject = (input: ProjectManager.SaveProjectInput): ProjectManager.Project => {
    const projects = getProjects()
    const projectId = input.projectId ?? createProjectId()
    const saved: ProjectManager.Project = {
      id: projectId,
      name: input.name.trim(),
      updatedAt: new Date().toISOString(),
      tickets: extractTickets(input.state),
      state: EstimationsGraph.normalizeGraphState(input.state),
    }

    const existingIndex = projects.findIndex((project) => project.id === projectId)
    if (existingIndex >= 0) {
      projects[existingIndex] = saved
    } else {
      projects.unshift(saved)
    }

    saveProjects(projects)
    return saved
  }

  return {
    getProjects,

    getProject(projectId: string): ProjectManager.Project | null {
      const projects = getProjects()
      return projects.find((project) => project.id === projectId) ?? null
    },

    saveProject,

    createDraftProject(initialState: ProjectManager.ProjectState = EstimationsGraph.createInitialState()): ProjectManager.Project {
      const projectId = createDraftProjectId()
      return saveProject({
        projectId,
        name: projectId,
        state: initialState,
      })
    },
  }
}

export const projectManager = createLocalStorageProjectManager()

function createProjectId(): string {
  return `p-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function createDraftProjectId(date: Date = new Date()): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `draft/${year}_${month}_${day}_${hours}_${minutes}`
}

function extractTickets(state: ProjectManager.ProjectState): string[] {
  const unique = new Set<string>()
  state.nodes.forEach((node) => {
    const label = node.data?.label?.trim()
    if (label) unique.add(label)
  })
  return Array.from(unique)
}
