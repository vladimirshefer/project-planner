import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EstimationsGraph } from '../../utils/estimations-graph'
import { projectManager } from '../../utils/project-manager'
import { decodeSharePayload, isShareSupported } from '../../utils/share-url'

export function SharePage({
  payload,
}: {
  payload: string
}) {
  const navigate = useNavigate()
  const [importResult, setImportResult] = useState<EstimationsGraph.TextImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [isImporting, setIsImporting] = useState(true)

  useEffect(() => {
    let cancelled = false

    if (!payload) {
      setImportResult(null)
      setImportError('Missing share data.')
      setIsImporting(false)
      return
    }

    if (!isShareSupported()) {
      setImportResult(null)
      setImportError('Share links are not supported in this browser.')
      setIsImporting(false)
      return
    }

    setImportResult(null)
    setImportError('')
    setIsImporting(true)

    decodeSharePayload(payload)
      .then((result) => {
        if (cancelled) return
        setImportResult(result)
      })
      .catch((error) => {
        if (cancelled) return
        setImportError(error instanceof Error ? error.message : 'Failed to import share link.')
      })
      .finally(() => {
        if (cancelled) return
        setIsImporting(false)
      })

    return () => {
      cancelled = true
    }
  }, [payload])

  const onCreateDraft = useCallback(() => {
    if (!importResult) return
    const saved = projectManager.createDraftProject(importResult.state)
    navigate(`/projects/${encodeURIComponent(saved.id)}`)
  }, [importResult, navigate])

  return (
    <div className="min-h-screen w-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto flex max-w-2xl flex-col gap-4 rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Import Shared Project</h1>
            <p className="text-sm text-gray-500">Create a new local draft from this share link.</p>
          </div>
          <Link to="/projects" className="rounded border px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Projects
          </Link>
        </div>

        {isImporting && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            Decoding shared project...
          </div>
        )}

        {!isImporting && importError && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {importError}
          </div>
        )}

        {!isImporting && importResult && (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Items</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.nodes.length}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Relations</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.edges.length}</p>
              </div>
              <div className="rounded-lg border bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-gray-500">Workers</p>
                <p className="text-lg font-semibold text-gray-800">{importResult.state.workers.length}</p>
              </div>
            </div>

            {importResult.report.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Import warnings: {importResult.report.warnings.length}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <Link to="/projects" className="rounded border px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </Link>
              <button
                type="button"
                onClick={onCreateDraft}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Create Draft
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
