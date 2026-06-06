import { useEffect, useRef, useState } from 'react'

/**
 * Measures a container and returns the largest square (in px) that fits inside
 * it — i.e. min(width, height). Used to keep the chessboard square and sized by
 * the available height, not just width.
 */
export function useSquareSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      const { width, height } = el.getBoundingClientRect()
      setSize(Math.floor(Math.max(0, Math.min(width, height))))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return { ref, size }
}
