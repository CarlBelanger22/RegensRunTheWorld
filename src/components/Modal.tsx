import { X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  title: string
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Optional wider dialog */
  wide?: boolean
}

export function Modal({ title, open, onClose, children, wide }: ModalProps) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)

    // Focus close only on open, and only if nothing inside the dialog is focused
    // (e.g. an input with autoFocus). Do not re-run when onClose identity changes.
    queueMicrotask(() => {
      const panel = panelRef.current
      if (!panel) return
      if (panel.contains(document.activeElement)) return
      closeRef.current?.focus()
    })

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          'my-4 w-full rounded-lg border border-border bg-panel shadow-xl',
          wide ? 'max-w-3xl' : 'max-w-lg',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current()}
            className="rounded p-1 text-muted hover:bg-panel-raised hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <div
          className={[
            'overflow-y-auto px-3 py-3',
            wide
              ? 'max-h-[min(92vh,52rem)]'
              : 'max-h-[min(80vh,40rem)]',
          ].join(' ')}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
