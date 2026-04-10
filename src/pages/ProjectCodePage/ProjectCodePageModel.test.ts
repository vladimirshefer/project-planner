import { describe, expect, it, vi } from 'vitest'
import { EstimationsGraph } from '../../utils/estimations-graph'
import { ProjectManager } from '../../utils/project-manager'
import { ProjectCodePageModel } from './ProjectCodePageModel'

describe('ProjectCodePageModel', () => {
  it('loads serialized YAML for a project state', () => {
    const text = ProjectCodePageModel.toEditorText(EstimationsGraph.createInitialState())
    expect(text).toContain('version: 1')
    expect(text).toContain('items:')
  })

  it('applies valid YAML and saves the project', () => {
    let savedProject: ProjectManager.Project = {
      id: 'work/project-1',
      name: 'Work',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tickets: [],
      state: EstimationsGraph.createInitialState(),
    }
    const saveProject = vi.fn((input: ProjectManager.SaveProjectInput) => {
      savedProject = {
        ...savedProject,
        id: input.projectId ?? savedProject.id,
        name: input.name.trim(),
        state: input.state,
        updatedAt: '2026-01-02T00:00:00.000Z',
      }
      return savedProject
    })
    const nextText = 'version: 1\nitems:\n  - name: API\n    estimate: 3\n'

    const result = ProjectCodePageModel.applyText({
      projectId: savedProject.id,
      projectName: savedProject.name,
      rawText: nextText,
      saveProject,
    })

    expect(result.ok).toBe(true)
    expect(saveProject).toHaveBeenCalledTimes(1)
    expect(savedProject.state.nodes.some((node) => node.data.label === 'API')).toBe(true)
  })

  it('returns error and does not overwrite saved project on invalid YAML', () => {
    const initialState = EstimationsGraph.createInitialState()
    let savedProject: ProjectManager.Project = {
      id: 'work/project-1',
      name: 'Work',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tickets: [],
      state: initialState,
    }
    const saveProject = vi.fn((input: ProjectManager.SaveProjectInput) => {
      savedProject = {
        ...savedProject,
        id: input.projectId ?? savedProject.id,
        name: input.name.trim(),
        state: input.state,
        updatedAt: '2026-01-02T00:00:00.000Z',
      }
      return savedProject
    })

    const result = ProjectCodePageModel.applyText({
      projectId: savedProject.id,
      projectName: savedProject.name,
      rawText: 'version: 1\nitems: [',
      saveProject,
    })

    expect(result.ok).toBe(false)
    expect(saveProject).not.toHaveBeenCalled()
    expect(savedProject.state).toEqual(initialState)
  })
})
