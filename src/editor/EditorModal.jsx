import styles from '../admin/AdminMapEditorPage.module.css'

export function EditorModal({ children, labelledBy, onClose }) {
  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.editModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {children}
      </section>
    </div>
  )
}
