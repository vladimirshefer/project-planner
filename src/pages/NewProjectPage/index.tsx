import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SampleProject } from '../../utils/sample-project'
import { projectManager } from '../../utils/project-manager'

export function NewProjectPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const template = searchParams.get('template')
  const hasCreatedDraftRef = useRef(false)

  useEffect(() => {
    if (hasCreatedDraftRef.current) return
    hasCreatedDraftRef.current = true
    const saved = projectManager.createDraftProject(
      template === 'sample' ? SampleProject.createState() : undefined
    )
    navigate(`/projects/${encodeURIComponent(saved.id)}`, { replace: true })
  }, [navigate, template])

  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border rounded p-6 text-sm text-gray-600">Creating draft...</div>
    </div>
  )
}
