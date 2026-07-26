export function MapControlGroup({ children, label, position }) {
  const positionClassName = position === 'left' ? 'left-4' : 'right-4'

  return (
    <div
      className={`fixed bottom-4 z-20 ${positionClassName} grid gap-1 bg-white [&>button]:min-h-7 [&>button]:w-8 [&>button]:text-lg [&>button]:leading-none`}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  )
}
