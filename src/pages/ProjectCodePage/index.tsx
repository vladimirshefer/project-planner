import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EstimationsGraph } from '../../utils/estimations-graph'
import { projectManager } from '../../utils/project-manager'
import { MissingProjectPage } from '../MissingProjectPage'
import { ProjectCodeEditor } from './ProjectCodeEditor'
import { ProjectCodePageModel } from './ProjectCodePageModel'

export function ProjectCodePage({
  projectId,
}: {
  projectId: string
}) {
  const loadedProject = useMemo(() => projectManager.getProject(projectId), [projectId])
  const [project, setProject] = useState(loadedProject)
  const [modalText, setModalText] = useState(() => loadedProject ? ProjectCodePageModel.toEditorText(loadedProject.state) : '')
  const [importError, setImportError] = useState('')
  const [importReport, setImportReport] = useState<EstimationsGraph.ImportReport | null>(null)

  useEffect(() => {
    setProject(loadedProject)
    setImportError('')
    setImportReport(null)
    setModalText(loadedProject ? ProjectCodePageModel.toEditorText(loadedProject.state) : '')
  }, [loadedProject])

  const onApply = useCallback(() => {
    if (!project) return

    const result = ProjectCodePageModel.applyText({
      projectId: project.id,
      projectName: project.name,
      rawText: modalText,
      saveProject: projectManager.saveProject,
    })

    if (!result.ok) {
      setImportError(result.error)
      setImportReport(null)
      return
    }

    setProject(result.savedProject)
    setModalText(ProjectCodePageModel.toEditorText(result.savedProject.state))
    setImportError('')
    setImportReport(result.report)
  }, [project, modalText])

  if (!project) return <MissingProjectPage />

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50">
      <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm md:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-slate-800 md:text-xl">Project Code: {project.name}</h1>
            <p className="text-xs text-slate-500 md:text-sm">Edit the project YAML and apply changes directly.</p>
          </div>
          <Link
            to={`/projects/${encodeURIComponent(project.id)}`}
            className="shrink-0 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-900"
          >
            Back to Editor
          </Link>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col px-4 py-4 md:px-6 md:py-5">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col gap-3">
          <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
            <ProjectCodeEditor
              modalText={modalText}
              importError={importError}
              onModalTextChange={setModalText}
              onApply={onApply}
            />
          </section>

          {importReport && (
            <section className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm md:p-4">
              <h2 className="text-sm font-semibold text-slate-800">Code Apply Report</h2>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700 md:grid-cols-6">
                <p>Items: <span className="font-semibold">{importReport.importedItems}</span></p>
                <p>Workers: <span className="font-semibold">{importReport.importedWorkers}</span></p>
                <p>Relations: <span className="font-semibold">{importReport.importedRelations}</span></p>
                <p>Normalized: <span className="font-semibold">{importReport.normalizedValues}</span></p>
                <p>Skipped rels: <span className="font-semibold">{importReport.skippedRelations}</span></p>
                <p>Renamed: <span className="font-semibold">{importReport.renamedItems}</span></p>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700">
                  Warnings ({importReport.warnings.length})
                </summary>
                <div className="mt-2 max-h-40 overflow-auto rounded border border-slate-200 bg-slate-50 p-2 font-mono text-xs text-slate-700">
                  {importReport.warnings.length === 0 ? (
                    <p>No warnings.</p>
                  ) : (
                    importReport.warnings.map((warning, index) => (
                      <p key={`${warning}-${index}`}>- {warning}</p>
                    ))
                  )}
                </div>
              </details>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
