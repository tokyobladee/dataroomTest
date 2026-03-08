import { useEffect, useRef, useState } from "react"

interface SelRect { x1: number; y1: number; x2: number; y2: number }

export interface DisplayRect {
  left: number; top: number; width: number; height: number
}

export function useRubberBand(
  containerRef: React.RefObject<HTMLElement | null>,
  onSelect: (ids: string[]) => void,
) {
  const [selRect, setSelRect] = useState<SelRect | null>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const draggingRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect })

  function onMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return
    const target = e.target as Element
    // Don't start on interactive elements or table rows (handled by row click)
    if (target.closest('button, a, input, select, thead, [data-item-id]')) return

    e.preventDefault()
    startRef.current = { x: e.clientX, y: e.clientY }
    draggingRef.current = true
    setSelRect({ x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY })
  }

  useEffect(() => {
    if (!draggingRef.current) return

    function onMouseMove(e: MouseEvent) {
      if (!startRef.current || !containerRef.current) return

      const r: SelRect = {
        x1: startRef.current.x,
        y1: startRef.current.y,
        x2: e.clientX,
        y2: e.clientY,
      }
      setSelRect(r)

      // Clip to container viewport rect for intersection test
      const cr = containerRef.current.getBoundingClientRect()
      const normLeft   = Math.max(Math.min(r.x1, r.x2), cr.left)
      const normRight  = Math.min(Math.max(r.x1, r.x2), cr.right)
      const normTop    = Math.max(Math.min(r.y1, r.y2), cr.top)
      const normBottom = Math.min(Math.max(r.y1, r.y2), cr.bottom)

      const ids: string[] = []
      const rows = containerRef.current.querySelectorAll<HTMLElement>('tr[data-item-id]')
      for (const row of rows) {
        const rb = row.getBoundingClientRect()
        if (rb.left < normRight && rb.right > normLeft && rb.top < normBottom && rb.bottom > normTop) {
          const id = row.getAttribute('data-item-id')
          if (id) ids.push(id)
        }
      }
      onSelectRef.current(ids)
    }

    function onMouseUp() {
      setSelRect(null)
      startRef.current = null
      draggingRef.current = false
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [selRect !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayRect: DisplayRect | null = selRect ? {
    left:   Math.min(selRect.x1, selRect.x2),
    top:    Math.min(selRect.y1, selRect.y2),
    width:  Math.abs(selRect.x2 - selRect.x1),
    height: Math.abs(selRect.y2 - selRect.y1),
  } : null

  return { onMouseDown, displayRect }
}
