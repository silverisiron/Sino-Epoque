import styles from '../admin/AdminMapEditorPage.module.css'
import { PanelHeader } from './PanelHeader'

export function DataManager({ addLabel = '추가', children, heading, onAdd, summary }) {
  return (
    <details className={styles.dataManager}>
      <summary>{summary}</summary>
      <PanelHeader actionLabel={addLabel} onAction={onAdd} title={heading} />
      {children}
    </details>
  )
}
