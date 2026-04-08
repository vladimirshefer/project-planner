import { useRef, useState } from 'react'
import { LuCalendarRange, LuCode, LuFolderOpen, LuPin, LuSave, LuUsers } from 'react-icons/lu'
import { useClickOutside } from '../utils/use-click-outside'
import {useNavigate} from "react-router-dom";

export function EditorNavbar({
  projectId,
  onSave,
  onRename,
  onSaveAsNew,
  onEditCode
}: {
  projectId?: string | null
  onSave: () => void
  onRename: () => void
  onSaveAsNew: () => void
  onEditCode: () => void
}) {
  const navigate = useNavigate()
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  const [saveMenuOpen, setSaveMenuOpen] = useState(false)
  const saveMenuRef = useRef<HTMLDivElement | null>(null)
  const isSidebarExpanded = isSidebarPinned || isSidebarHovered
  const iconClassName = 'h-4 w-4 shrink-0'

  const onOpenProjects= () => navigate('/projects')
  const onOpenWorkers= () => projectId && navigate(`/projects/${encodeURIComponent(projectId)}/workers`)
  const onOpenTimeline= () => projectId && navigate(`/projects/${encodeURIComponent(projectId)}/timeline`)

  useClickOutside(saveMenuRef, saveMenuOpen, () => setSaveMenuOpen(false))

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm border shadow-md rounded-lg transition-all duration-200 ${
        isSidebarExpanded ? 'w-44' : 'w-12'
      }`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={() => setIsSidebarHovered(false)}
    >
      <div className="p-1 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setIsSidebarPinned((value) => !value)}
          title={isSidebarPinned ? 'Unpin sidebar' : 'Pin sidebar'}
          className="h-10 w-full rounded-md border border-transparent hover:bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-2 px-3 transition-colors"
        >
          <LuPin className={iconClassName} aria-hidden="true" />
          {isSidebarExpanded && <span>{isSidebarPinned ? 'Unpin' : 'Pin'}</span>}
        </button>

        <div className="relative" ref={saveMenuRef}>
          <div className="flex items-stretch gap-0">
            <button
              type="button"
              onClick={onSave}
              title="Save (Ctrl+S)"
              className={`h-10 ${isSidebarExpanded ? 'flex-1 rounded-l-md' : 'w-full rounded-md'} bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold flex items-center gap-2 px-3 transition-colors`}
            >
              <LuSave className={iconClassName} aria-hidden="true" />
              {isSidebarExpanded && <span>Save</span>}
            </button>
            {isSidebarExpanded && (
              <button
                type="button"
                onClick={() => setSaveMenuOpen((value) => !value)}
                className="h-10 w-9 rounded-r-md border-l border-teal-500 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                aria-label="Open save options"
              >
                ▾
              </button>
            )}
          </div>

          {saveMenuOpen && isSidebarExpanded && (
            <div className="absolute left-0 right-0 mt-2 rounded border bg-white shadow-lg z-10 overflow-hidden">
              {projectId && (
                <button
                  type="button"
                  onClick={() => {
                    setSaveMenuOpen(false)
                    onRename()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Rename Project
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSaveMenuOpen(false)
                  onSaveAsNew()
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                Fork Project
              </button>
            </div>
          )}
        </div>

        {onOpenProjects && (
          <button
            type="button"
            onClick={onOpenProjects}
            title="Projects"
            className="h-10 w-full rounded-md hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 px-3 transition-colors"
          >
            <LuFolderOpen className={iconClassName} aria-hidden="true" />
            {isSidebarExpanded && <span>Projects</span>}
          </button>
        )}

        {onOpenWorkers && (
          <button
            type="button"
            onClick={onOpenWorkers}
            title="Workers"
            className="h-10 w-full rounded-md hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 px-3 transition-colors"
          >
            <LuUsers className={iconClassName} aria-hidden="true" />
            {isSidebarExpanded && <span>Workers</span>}
          </button>
        )}

        {onOpenTimeline && (
          <button
            type="button"
            onClick={onOpenTimeline}
            title="Timeline"
            className="h-10 w-full rounded-md hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 px-3 transition-colors"
          >
            <LuCalendarRange className={iconClassName} aria-hidden="true" />
            {isSidebarExpanded && <span>Timeline</span>}
          </button>
        )}

        <button
          type="button"
          onClick={onEditCode}
          title="Edit Code"
          className="h-10 w-full rounded-md hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-2 px-3 transition-colors"
        >
          <LuCode className={iconClassName} aria-hidden="true" />
          {isSidebarExpanded && <span>Edit Code</span>}
        </button>
      </div>
    </div>
  )
}
