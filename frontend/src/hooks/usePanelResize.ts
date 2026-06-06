import { useCallback, useRef } from 'react'

type ResizeSide = 'left' | 'right'

interface UsePanelResizeProps {
  leftWidth: number
  rightWidth: number
  setLeftWidth: (w: number) => void
  setRightWidth: (w: number) => void
  minLeft: number
  minCenter: number
  minRight: number
  dividerWidth: number
}

/**
 * Drag-to-resize logic for the two dividers, implemented from scratch with
 * mouse/touch events (no third-party library). Minimums are enforced here so
 * the center panel always keeps room.
 */
export function usePanelResize({
  leftWidth,
  rightWidth,
  setLeftWidth,
  setRightWidth,
  minLeft,
  minCenter,
  minRight,
  dividerWidth,
}: UsePanelResizeProps) {
  const dragging = useRef<ResizeSide | null>(null)
  const startX = useRef<number>(0)
  const startLeft = useRef<number>(0)
  const startRight = useRef<number>(0)

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - startX.current
      const totalWidth = window.innerWidth - dividerWidth * 2

      if (dragging.current === 'left') {
        const newLeft = Math.max(minLeft, startLeft.current + dx)
        const maxLeft = totalWidth - startRight.current - minCenter
        setLeftWidth(Math.min(newLeft, maxLeft))
      }

      if (dragging.current === 'right') {
        const newRight = Math.max(minRight, startRight.current - dx)
        const maxRight = totalWidth - startLeft.current - minCenter
        setRightWidth(Math.min(newRight, maxRight))
      }
    },
    [minLeft, minCenter, minRight, dividerWidth, setLeftWidth, setRightWidth],
  )

  const onMouseUp = useCallback(() => {
    dragging.current = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }, [onMouseMove])

  const startDrag = useCallback(
    (side: ResizeSide, e: React.MouseEvent) => {
      e.preventDefault()
      dragging.current = side
      startX.current = e.clientX
      startLeft.current = leftWidth
      startRight.current = rightWidth
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [leftWidth, rightWidth, onMouseMove, onMouseUp],
  )

  // ---- Touch support ----
  const onTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging.current) return
      const touch = e.touches[0]
      onMouseMove({ clientX: touch.clientX } as MouseEvent)
    },
    [onMouseMove],
  )

  const onTouchEnd = useCallback(() => {
    dragging.current = null
    document.body.style.userSelect = ''
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('touchend', onTouchEnd)
  }, [onTouchMove])

  const startTouchDrag = useCallback(
    (side: ResizeSide, e: React.TouchEvent) => {
      dragging.current = side
      startX.current = e.touches[0].clientX
      startLeft.current = leftWidth
      startRight.current = rightWidth
      document.body.style.userSelect = 'none'
      window.addEventListener('touchmove', onTouchMove)
      window.addEventListener('touchend', onTouchEnd)
    },
    [leftWidth, rightWidth, onTouchMove, onTouchEnd],
  )

  return { startDrag, startTouchDrag }
}
