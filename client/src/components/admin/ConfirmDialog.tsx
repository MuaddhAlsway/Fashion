import { useEffect, useId, useRef, type ReactNode } from 'react'

function ConfirmDialog({ title, children, confirmLabel = 'Remove', onConfirm, onCancel }: { title: string; children: ReactNode; confirmLabel?: string; onConfirm: () => void; onCancel: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const id = useId()
  useEffect(() => {
    const element = dialog.current
    element?.showModal()
    cancel.current?.focus()
    return () => element?.close()
  }, [])
  return <dialog className="admin-confirm" ref={dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event => { event.preventDefault(); onCancel() }}>
    <h2 id={`${id}-title`}>{title}</h2><div id={`${id}-description`}>{children}</div>
    <div className="admin-actions"><button ref={cancel} type="button" onClick={onCancel}>Cancel</button><button className="admin-danger" type="button" onClick={onConfirm}>{confirmLabel}</button></div>
  </dialog>
}
export default ConfirmDialog
