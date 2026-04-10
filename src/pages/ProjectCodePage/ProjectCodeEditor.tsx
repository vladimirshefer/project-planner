export function ProjectCodeEditor({
  modalText,
  importError,
  onModalTextChange,
  onApply,
}: {
  modalText: string
  importError: string
  onModalTextChange: (value: string) => void
  onApply: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <textarea
        value={modalText}
        onChange={(event) => onModalTextChange(event.target.value)}
        className="h-full min-h-0 w-full flex-1 resize-none rounded-md border border-slate-300 bg-white p-3 font-mono text-sm leading-6 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={'Paste YAML like:\nversion: 1\nitems:\n  - name: "Item A"'}
      />
      {importError && <p className="text-xs text-red-600">{importError}</p>}
      <div className="flex shrink-0 justify-end gap-2">
        <button
          onClick={onApply}
          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>
  )
}
