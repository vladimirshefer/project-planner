import { Link } from 'react-router-dom'

export function MissingProjectPage() {
  return (
    <div className="h-screen w-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white border rounded p-6 text-sm text-gray-600 flex flex-col gap-3">
        <p>Project not found.</p>
        <Link to="/projects" className="px-3 py-1.5 text-sm font-semibold rounded bg-gray-800 text-white text-center">
          Back to Projects
        </Link>
      </div>
    </div>
  )
}
