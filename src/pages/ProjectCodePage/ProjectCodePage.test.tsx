import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { EstimationsGraph } from '../../utils/estimations-graph'

const { mockGetProject, mockSaveProject } = vi.hoisted(() => ({
  mockGetProject: vi.fn(),
  mockSaveProject: vi.fn(),
}))

vi.mock('../../utils/project-manager', () => ({
  projectManager: {
    getProject: mockGetProject,
    saveProject: mockSaveProject,
  },
}))

import { ProjectCodePage } from './index'

describe('ProjectCodePage', () => {
  beforeEach(() => {
    mockGetProject.mockReset()
    mockSaveProject.mockReset()
  })

  it('renders fullscreen editor workspace layout and back navigation', () => {
    mockGetProject.mockReturnValue({
      id: 'work/project-1',
      name: 'Work',
      updatedAt: '2026-01-01T00:00:00.000Z',
      tickets: [],
      state: EstimationsGraph.createInitialState(),
    })

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProjectCodePage projectId="work/project-1" />
      </MemoryRouter>
    )

    expect(html).toContain('flex h-screen w-screen flex-col overflow-hidden')
    expect(html).toContain('flex min-h-0 flex-1 flex-col')
    expect(html).toContain('Project Code: Work')
    expect(html).toContain('/projects/work%2Fproject-1')
  })

  it('renders missing-project page when project does not exist', () => {
    mockGetProject.mockReturnValue(null)

    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ProjectCodePage projectId="missing/project" />
      </MemoryRouter>
    )

    expect(html).toContain('Project not found.')
  })
})
