import {useEffect, useRef} from "react";

export function EstimateInputRow(
    {
        isEditing,
        value,
        onFocus,
        onChange,
        onCommit,
        onCancel,
    }: {
        isEditing: boolean
        value: string
        onFocus: () => void
        onChange: (value: string) => void
        onCommit: () => void
        onCancel: () => void
    }
) {
    const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
        if (!isEditing) return
        inputRef.current?.focus()
        inputRef.current?.select()
    }, [isEditing])

    return (
        <div
            className="flex justify-between items-center gap-2 rounded border border-slate-200 px-2 py-1 bg-slate-50/70">
            <span className="whitespace-nowrap font-medium text-[9px] uppercase tracking-wide text-slate-500">Base estimate</span>
            <div className="w-20 min-h-[26px] flex items-center justify-end">
                <input
                    ref={inputRef}
                    type="number"
                    value={value}
                    className="w-20 border rounded px-2 text-right text-sm font-semibold leading-none focus:ring-1 focus:ring-blue-500 outline-none bg-white text-slate-700"
                    onFocus={onFocus}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onCommit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onCommit()
                        if (e.key === 'Escape') {
                            e.preventDefault()
                            onCancel()
                        }
                    }}
                />
            </div>
        </div>
    )
}