import { useEffect } from 'react'

export function useOnKey(key: string, enabled: boolean, callback: () => void) {
  useEffect(() => {
    if (!enabled) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key) return
      callback()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [callback, enabled, key])
}
