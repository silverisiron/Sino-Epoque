import styles from '../admin/AdminMapEditorPage.module.css'

export function MapControlGroup({ children, label, position }) {
  const positionClassName =
    position === 'left' ? styles.mapControlGroupLeft : styles.mapControlGroupRight

  return (
    <div
      className={`${styles.mapControlGroup} ${positionClassName} m-0 grid gap-1 border border-[#aeb7c2] bg-white p-1.5 [&>button]:min-h-7 [&>button]:w-8 [&>button]:text-lg [&>button]:leading-none`}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  )
}
