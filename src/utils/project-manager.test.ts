import { describe, expect, it } from 'vitest'
import { EstimationsGraph } from './estimations-graph'
import { createLocalStorageProjectManager } from './project-manager'

class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value)
  }
}

describe('ProjectManager', () => {
  it('creates a new saved project', () => {
    const manager = createLocalStorageProjectManager(new MemoryStorage())
    const state = EstimationsGraph.createInitialState()

    const saved = manager.saveProject({ name: 'Alpha', state })

    expect(saved.id).toMatch(/^p-\d+-\d+$/)
    expect(saved.name).toBe('Alpha')
    expect(manager.getProject(saved.id)?.id).toBe(saved.id)
  })

  it('updates an existing saved project by id', () => {
    const manager = createLocalStorageProjectManager(new MemoryStorage())
    const first = manager.saveProject({ name: 'Alpha', state: EstimationsGraph.createInitialState() })
    const nextState: EstimationsGraph.GraphState = {
      ...EstimationsGraph.createInitialState(),
      workers: [{ id: 'w-1', name: 'Marta', skills: ['react'], availabilityPercent: 80 }],
    }

    const updated = manager.saveProject({ projectId: first.id, name: 'Beta', state: nextState })

    expect(updated.id).toBe(first.id)
    expect(updated.name).toBe('Beta')
    expect(manager.getProjects()).toHaveLength(1)
    expect(manager.getProject(first.id)?.state.workers).toHaveLength(1)
  })

  it('returns normalized saved projects from getProjects', () => {
    const storage = new MemoryStorage()
    storage.setItem('planning-assistant-projects-v1', JSON.stringify([
      {
        id: 'work/project-1',
        name: 'Work',
        updatedAt: '2026-04-05T09:07:00.000Z',
        tickets: [],
        state: {
          nodes: [{ id: '1', position: { x: 0, y: 0 }, data: { label: 'Task', estimate: 1 }, type: 'editable' }],
          edges: [],
          workers: [],
        },
      },
    ]))
    const manager = createLocalStorageProjectManager(storage)

    const projects = manager.getProjects()

    expect(projects).toHaveLength(1)
    expect(projects[0]!.state.nodes[0]!.data.assigneeIds).toEqual([])
    expect(projects[0]!.state.nodes[0]!.data.requiredSkills).toEqual([])
  })

  it('returns saved projects with slash-delimited ids', () => {
    const manager = createLocalStorageProjectManager(new MemoryStorage())
    manager.saveProject({
      projectId: 'work/project-1',
      name: 'Work',
      state: EstimationsGraph.createInitialState(),
    })

    expect(manager.getProject('work/project-1')?.id).toBe('work/project-1')
  })

  it('creates a draft project as a normal saved project', () => {
    const manager = createLocalStorageProjectManager(new MemoryStorage())
    const draftState: EstimationsGraph.GraphState = {
      ...EstimationsGraph.createInitialState(),
      workers: [{ id: 'w-1', name: 'Marta', skills: ['react'], availabilityPercent: 80 }],
    }

    const archived = manager.createDraftProject(draftState)

    expect(archived).not.toBeNull()
    expect(archived?.id).toMatch(/^draft\/\d{4}_\d{2}_\d{2}_\d{2}_\d{2}$/)
    expect(archived?.name).toBe(archived?.id)
    expect(manager.getProject(archived!.id)?.id).toBe(archived?.id)
    expect(manager.getProject(archived!.id)?.state.workers).toHaveLength(1)
  })
})
