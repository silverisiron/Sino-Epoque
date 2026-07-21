import styles from '../admin/AdminMapEditorPage.module.css'

export function PanelHeader({ actionLabel = '추가', headingId, onAction, title }) {
  return (
    <header className={styles.sideHeader}>
      <h2 id={headingId}>{title}</h2>
      {onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </header>
  )
}
