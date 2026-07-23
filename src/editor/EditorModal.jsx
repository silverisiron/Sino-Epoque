import { useRef, useState } from 'react'
import { ModalSaveAlert } from './ModalSaveAlert'

export function EditorModal({
  applyDisabled = false,
  applyLabel = '적용',
  children,
  closeOnApply = false,
  enableSelectAll = false,
  labelledBy,
  onApply,
  onClose,
  showSaveAlert = true,
  title,
}) {
  const [isSaved, setIsSaved] = useState(false)
  const formRef = useRef(null)

  function handleSubmit(event) {
    event.preventDefault()

    if (applyDisabled || onApply() === false) {
      return
    }

    if (closeOnApply) {
      onClose()
      return
    }

    setIsSaved(true)
  }

  function toggleAllCheckboxes() {
    const checkboxes = [
      ...formRef.current.querySelectorAll('input[type="checkbox"]:not(:disabled)'),
    ]
    const shouldSelect = checkboxes.some((checkbox) => !checkbox.checked)

    for (const checkbox of checkboxes) {
      if (checkbox.checked !== shouldSelect) {
        checkbox.click()
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center bg-[#17202a]/45 p-3"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="max-h-[calc(100vh-24px)] w-full max-w-[520px] overflow-y-auto border border-[#aeb7c2] bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form
          className="grid gap-3.5 p-4 [&_output]:min-h-8 [&_output]:border [&_output]:border-[#d5dbe3] [&_output]:px-2 [&_output]:py-1.5"
          onChange={() => setIsSaved(false)}
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <header className="flex items-center justify-between gap-2 border-b border-[#d5dbe3] pb-3">
            <h2 id={labelledBy}>{title}</h2>
            <div className="flex items-center justify-between gap-2">
              <button type="submit" disabled={applyDisabled}>
                {applyLabel}
              </button>
              <button type="button" aria-label="닫기" onClick={onClose}>
                ×
              </button>
            </div>
          </header>

          {showSaveAlert ? <ModalSaveAlert visible={isSaved} /> : null}
          {enableSelectAll ? (
            <button
              className="justify-self-end"
              type="button"
              onClick={toggleAllCheckboxes}
            >
              모두 선택/해제
            </button>
          ) : null}
          {children}
        </form>
      </section>
    </div>
  )
}
