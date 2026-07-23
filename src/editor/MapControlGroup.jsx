import styles from '../admin/AdminMapEditorPage.module.css'

export function MapControlGroup({ children, label, position }) {
  const positionClassName =
    position === 'left' ? styles.mapControlGroupLeft : styles.mapControlGroupRight

  return (
    <div
      className={`${styles.mapControlGroup} ${positionClassName}`}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  )
}
