import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClickOutside } from '../../utils/use-click-outside'
import { projectManager } from '../../utils/project-manager'

export function ProjectsPage() {
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
                onClick={() => navigate(`/projects/${encodeURIComponent(project.id)}`)}
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
