import {ProjectStats} from "../../utils/project-stats";
import {useRef, useState} from "react";
import {useClickOutside} from "../../utils/use-click-outside";
import {useOnKey} from "../../utils/use-on-key";

export function EstimateSummary(
    {
        totals,
    }: {
        totals: ProjectStats.ViewMarks
    }
) {
    const [isOpen, setIsOpen] = useState(false)
    const rootRef = useRef<HTMLDivElement | null>(null)

    useClickOutside(rootRef, isOpen, () => setIsOpen(false))
    useOnKey('Escape', isOpen, () => setIsOpen(false))

    return (
        <div className="relative rounded-md border border-blue-100 px-2 py-2 shadow-sm" ref={rootRef}>
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-end justify-between gap-2" aria-label="Estimate summary">
                    <div title="Optimistic estimate - P30 - 30% chance"
                         className="flex min-w-0 flex-col items-start text-emerald-700">
                        <span
                            className="text-[8px] font-semibold uppercase tracking-wide text-emerald-600/80">Opt</span>
                        <span className="text-sm font-semibold leading-none">{totals.p30.toFixed(1)}</span>
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-center text-center text-sky-900">
                        <span
                            className="text-[8px] font-semibold uppercase tracking-[0.16em] text-sky-600">Expected avg</span>
                        <span
                            className="text-[28px] font-black leading-none tracking-tight">{totals.ev.toFixed(1)}</span>
                    </div>
                    <div title="Worst-case estimate - P95 - 95% confidence"
                         className="flex min-w-0 flex-col items-end text-orange-700">
                        <span
                            className="text-[8px] font-semibold uppercase tracking-wide text-orange-600/80">Worst</span>
                        <span className="text-sm font-semibold leading-none">{totals.p95.toFixed(1)}</span>
                    </div>
                </div>

                <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-label="Show estimate details"
                    onClick={() => setIsOpen((open) => !open)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-[10px] font-bold text-blue-700 shadow-sm hover:bg-blue-50"
                >
                    i
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 top-full z-20 mt-1 w-40 md border border-blue-100 bg-white p-2 shadow-lg">
                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-blue-500">Estimate
                        breakdown
                    </div>
                    <div className="space-y-1 text-[10px] text-slate-600">
                        <EstimateSummaryRow label="Expected avg" value={totals.ev} valueClassName="text-sky-800"/>
                        <EstimateSummaryRow label="Optimistic (P30)" value={totals.p30}
                                            valueClassName="text-emerald-700"/>
                        <EstimateSummaryRow label="P50" value={totals.p50} valueClassName="text-slate-800"/>
                        <EstimateSummaryRow label="P80" value={totals.p80} valueClassName="text-slate-800"/>
                        <EstimateSummaryRow label="Worst (P95)" value={totals.p95} valueClassName="text-orange-700"/>
                        <EstimateSummaryRow label="P99" value={totals.p99} valueClassName="text-slate-800"/>
                    </div>
                </div>
            )}
        </div>
    )
}

export function EstimateSummaryRow(
    {
        label,
        value,
        valueClassName,
    }: {
        label: string
        value: number
        valueClassName: string
    }
) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span>{label}</span>
            <span className={`font-semibold ${valueClassName}`}>{value.toFixed(1)}</span>
        </div>
    )
}
