import styles from '../admin/AdminMapEditorPage.module.css'

export function MapDisplayControlGroup({ children, legend }) {
  return (
    <fieldset className={styles.mapDisplayControls}>
      <legend>{legend}</legend>
      <div className={styles.mapDisplayControlItems}>{children}</div>
    </fieldset>
  )
}
