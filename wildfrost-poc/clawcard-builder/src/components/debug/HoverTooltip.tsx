import { useEffect, useState } from 'react'
import type { InspectMeta } from './Inspectable'

interface HoverState {
  meta: InspectMeta
  x: number
  y: number
}

/**
 * Renderuje developerski tooltip dla elementow oznaczonych jako inspectable.
 *
 * Nasluchuje globalnych zdarzen pointer i pokazuje opis komponentu tylko wtedy,
 * gdy kursor znajduje sie nad elementem z odpowiednimi atrybutami danych.
 *
 * @returns Tooltip developerski albo null, jesli nic nie jest aktualnie wskazane.
 */
export function HoverTooltip() {
  const [hoverState, setHoverState] = useState<HoverState | null>(null)

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Element)) {
        setHoverState(null)
        return
      }

      const inspectable = target.closest<HTMLElement>('[data-inspectable="true"]')

      if (!inspectable) {
        setHoverState(null)
        return
      }

      setHoverState({
        meta: {
          componentName: inspectable.dataset.componentName ?? 'Unknown',
          objectType: inspectable.dataset.objectType ?? 'Unknown',
          codeRef: inspectable.dataset.codeRef ?? 'Unknown',
          description: inspectable.dataset.description ?? 'No description',
        },
        x: event.clientX + 18,
        y: event.clientY + 18,
      })
    }

    function handlePointerLeave() {
      setHoverState(null)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerleave', handlePointerLeave)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerleave', handlePointerLeave)
    }
  }, [])

  if (!hoverState) {
    return null
  }

  return (
    <aside
      className="hover-tooltip"
      style={{
        left: `${hoverState.x}px`,
        top: `${hoverState.y}px`,
      }}
    >
      <p className="hover-tooltip__label">Component</p>
      <strong>{hoverState.meta.componentName}</strong>
      <p className="hover-tooltip__label">Object</p>
      <span>{hoverState.meta.objectType}</span>
      <p className="hover-tooltip__label">Code</p>
      <span>{hoverState.meta.codeRef}</span>
      <p className="hover-tooltip__label">Description</p>
      <span>{hoverState.meta.description}</span>
    </aside>
  )
}
