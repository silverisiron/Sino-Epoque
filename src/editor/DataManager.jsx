import styles from '../admin/AdminMapEditorPage.module.css'

export function DataManager({ addLabel = '추가', children, heading, onAdd, summary }) {
  return (
    <details className={styles.dataManager}>
      <summary>{summary}</summary>
      <div className={styles.sideHeader}>
        <h2>{heading}</h2>
        <button type="button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>
      {children}
    </details>
  )
}
