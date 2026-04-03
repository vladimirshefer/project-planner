import {EstimationsGraph} from "../../utils/estimations-graph";
import {useRef, useState} from "react";
import {useClickOutside} from "../../utils/use-click-outside";
import {useOnKey} from "../../utils/use-on-key";

export function AssigneeMenu(
    {
        initials,
        workers,
        assigneeIds,
        onChangeSelection,
    }: {
        initials: string
        workers: EstimationsGraph.WorkerDto[]
        assigneeIds: string[]
        onChangeSelection: (workerId: string, checked: boolean) => void
    }
) {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    useClickOutside(rootRef, isOpen, () => setIsOpen(false))
    useOnKey('Escape', isOpen, () => setIsOpen(false))

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
                className="cursor-pointer select-none rounded-full"
            >
        <span
            className="flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold text-gray-700 bg-gray-50">
          {initials}
        </span>
            </button>
            {isOpen && (
                <div
                    className="absolute left-0 mt-1 bg-white border rounded shadow-md z-10 min-w-[180px] max-h-[180px] overflow-auto p-1">
                    {workers.length === 0 && <div className="px-2 py-1.5 text-xs text-gray-500">No workers</div>}
                    {workers.map((worker) => (
                        <label key={worker.id}
                               className="flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                checked={assigneeIds.includes(worker.id)}
                                onChange={(e) => onChangeSelection(worker.id, e.target.checked)}
                            />
                            <span className="truncate">{worker.name}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    )
}