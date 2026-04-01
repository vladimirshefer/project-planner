import { useEffect, useRef, useState } from 'react'
import { EstimationsGraph } from '../utils/estimations-graph'

export function EdgeView({
  kind,
  probability,
  recovery,
  labelX,
  labelY,
  onChangeKind,
  onChangeProbability,
  onChangeRecovery,
}: {
  kind: EstimationsGraph.RelationKind
  probability: number
  recovery: number
  labelX: number
  labelY: number
  onChangeKind: (kind: EstimationsGraph.RelationKind) => void
  onChangeProbability: (value: number) => void
  onChangeRecovery: (value: number) => void
}) {
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const [isProbabilityVisible, setIsProbabilityVisible] = useState(probability !== 100)
  const [isRecoveryVisible, setIsRecoveryVisible] = useState(recovery !== 0)
  const optionsMenuRef = useRef<HTMLDivElement | null>(null)
  const showProbability = kind === 'contains' && isProbabilityVisible
  const showRecovery = kind === 'contains' && isRecoveryVisible

  useEffect(() => {
    if (kind !== 'contains') {
      setIsProbabilityVisible(false)
      setIsRecoveryVisible(false)
      return
    }
    if (probability !== 100) {
      setIsProbabilityVisible(true)
    }
    if (recovery !== 0) {
      setIsRecoveryVisible(true)
    }
  }, [kind, probability, recovery])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent | MouseEvent | TouchEvent) => {
      const target = event.target as globalThis.Node | null
      if (!target) return
      if (isOptionsOpen && optionsMenuRef.current && !optionsMenuRef.current.contains(target)) {
        setIsOptionsOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOptionsOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOptionsOpen])

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
        pointerEvents: 'all',
      }}
      className="z-20 bg-white px-1.5 py-1 rounded border border-blue-200 shadow-md flex flex-col gap-1 text-[8px] min-w-[56px]"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wide ${
              kind === 'after' ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-600'
            }`}
          >
            {kind === 'after' ? 'After' : 'Contains'}
          </span>
          {showProbability && (
            <label className="flex items-center gap-0.5 text-blue-600 font-bold">
              <span className="text-[7px] uppercase text-gray-400 font-semibold">Occur</span>
              <input
                type="number"
                value={probability}
                onChange={(e) => onChangeProbability(parseFloat(e.target.value) || 0)}
                className="w-8 text-right outline-none focus:ring-1 focus:ring-blue-400 rounded px-0.5 bg-white"
                min="0"
                max="100"
              />
              <span>%</span>
            </label>
          )}
          {showRecovery && (
            <label
              className="flex items-center gap-0.5 text-emerald-600 font-bold"
              title="Chance to still succeed if this dependency fails"
            >
              <span className="text-[7px] uppercase text-gray-400 font-semibold">Recov</span>
              <input
                type="number"
                value={recovery}
                onChange={(e) => onChangeRecovery(parseFloat(e.target.value) || 0)}
                className="w-8 text-right outline-none focus:ring-1 focus:ring-emerald-400 rounded px-0.5 bg-white"
                min="0"
                max="100"
              />
              <span>%</span>
            </label>
          )}
        </div>

        <div className="relative shrink-0" ref={optionsMenuRef}>
          <button
            type="button"
            aria-expanded={isOptionsOpen}
            onClick={() => setIsOptionsOpen((open) => !open)}
            className="list-none cursor-pointer select-none text-xs text-gray-500 px-1 py-0.5 rounded hover:bg-gray-100"
          >
            ...
          </button>
          {isOptionsOpen && (
            <div className="absolute right-0 mt-1 bg-white border rounded shadow-md z-30 min-w-[160px] p-1">
              <div className="px-2 py-1 text-[8px] font-semibold uppercase tracking-wide text-gray-400 border-b">
                Edge
              </div>
              <div className="px-2 py-1.5 border-b">
                <span className="block text-[8px] font-semibold uppercase text-gray-400 mb-1">Type</span>
                <select
                  value={kind}
                  onChange={(e) => onChangeKind(e.target.value as EstimationsGraph.RelationKind)}
                  className="w-full text-[10px] border rounded px-1.5 py-1 bg-white text-gray-700"
                >
                  <option value="contains">contains</option>
                  <option value="after">after</option>
                </select>
              </div>
              {kind === 'contains' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (showProbability) {
                        onChangeProbability(100)
                        setIsProbabilityVisible(false)
                      } else {
                        setIsProbabilityVisible(true)
                      }
                      if (showProbability && !showRecovery) {
                        setIsOptionsOpen(false)
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50 border-b"
                  >
                    {showProbability ? 'Remove OCCUR' : 'Add OCCUR'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (showRecovery) {
                        onChangeRecovery(0)
                        setIsRecoveryVisible(false)
                      } else {
                        setIsRecoveryVisible(true)
                      }
                      if (showRecovery && !showProbability) {
                        setIsOptionsOpen(false)
                      }
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  >
                    {showRecovery ? 'Remove RECOV' : 'Add RECOV'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
