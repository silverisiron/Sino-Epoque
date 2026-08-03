import { useState } from 'react'

function ModalSaveAlert({ visible }) {
  return visible ? (
    <p
      className="bg-[#edf6ef] text-[#245c32]"
      role="status"
    >
      저장되었습니다.
    </p>
  ) : null
}

export function EditorModal({
  submitDisabled = false,
  submitLabel = '적용',
  children,
  closeOnSubmit = false,
  labelledBy,
  onClose,
  onSubmit,
  showSaveAlert = true,
  title,
}) {
  const [isSaved, setIsSaved] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    if (submitDisabled || onSubmit() === false) {
      return
    }

    if (closeOnSubmit) {
      onClose()
      return
    }

    setIsSaved(true)
  }

  return (
    <div
      className="fixed inset-0 z-10 grid place-items-center bg-ink/45 p-3"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        className="scrollbar-custom max-h-[calc(100vh-24px)] w-full max-w-130 overflow-y-auto bg-white"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form
          className="grid gap-3.5 [&_output]:min-h-8"
          onChange={() => setIsSaved(false)}
          onSubmit={handleSubmit}
        >
          <header className="flex items-center justify-between gap-2">
            <h2 id={labelledBy}>{title}</h2>
            <div className="flex items-center justify-between gap-2">
              <button type="submit" disabled={submitDisabled}>
                {submitLabel}
              </button>
              <button type="button" aria-label="닫기" onClick={onClose}>
                ×
              </button>
            </div>
          </header>

          {showSaveAlert ? <ModalSaveAlert visible={isSaved} /> : null}
          {children}
        </form>
      </section>
    </div>
  )
}
