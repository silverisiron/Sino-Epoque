import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { ModalSaveAlert } from './ModalSaveAlert'

export function EditorModal({
  applyDisabled = false,
  applyLabel = '적용',
  children,
  closeOnApply = false,
  labelledBy,
  onApply,
  onClose,
  showSaveAlert = true,
  title,
}) {
  const [isSaved, setIsSaved] = useState(false)

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

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.editModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <form
          className={styles.modalForm}
          onChange={() => setIsSaved(false)}
          onSubmit={handleSubmit}
        >
          <header className={styles.modalHeader}>
            <h2 id={labelledBy}>{title}</h2>
            <div className={styles.modalActions}>
              <button type="submit" disabled={applyDisabled}>
                {applyLabel}
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
