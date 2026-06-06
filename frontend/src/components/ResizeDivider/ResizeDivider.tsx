import { DIVIDER_WIDTH } from '../../config/layoutConfig'

interface ResizeDividerProps {
  side: 'left' | 'right'
  onMouseDown: (side: 'left' | 'right', e: React.MouseEvent) => void
  onTouchStart: (side: 'left' | 'right', e: React.TouchEvent) => void
}

/** Draggable vertical divider with a 3-dot grip. */
export function ResizeDivider({
  side,
  onMouseDown,
  onTouchStart,
}: ResizeDividerProps) {
  return (
    <div
      className="resize-divider"
      role="separator"
      aria-orientation="vertical"
      onMouseDown={(e) => onMouseDown(side, e)}
      onTouchStart={(e) => onTouchStart(side, e)}
      style={{
        width: `${DIVIDER_WIDTH}px`,
        height: '100%',
        cursor: 'col-resize',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        transition: 'background-color 0.15s',
        zIndex: 10,
        touchAction: 'none',
      }}
    >
      {/* Visual grip indicator — 3 vertical dots. */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          pointerEvents: 'none',
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.25)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
