import { RefObject, useEffect } from 'react'

export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T | null>,
  enabled: boolean,
  onOutsideClick: () => void
) {
  useEffect(() => {
    if (!enabled) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null
      if (!target || !ref.current || ref.current.contains(target)) return
      onOutsideClick()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [enabled, onOutsideClick, ref])
}
