import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'

export function PanelCollapseButton({
  controls,
  expanded,
  label,
  onToggle,
  side,
}) {
  const isLeftPanel = side === 'left'
  const positionClassName = isLeftPanel
    ? expanded
      ? 'left-(--spacing-editor-sidebar)'
      : 'left-0'
    : expanded
      ? 'right-(--spacing-editor-sidebar)'
      : 'right-0'
  const CollapseIcon = isLeftPanel ? ChevronLeft : ChevronRight
  const ExpandIcon = isLeftPanel ? ChevronRight : ChevronLeft
  const Icon = expanded ? CollapseIcon : ExpandIcon
  const action = expanded ? '접기' : '펼치기'

  return (
    <button
      type="button"
      className={`pointer-events-auto absolute top-[calc(50%_+_((var(--spacing-editor-header)_-_var(--spacing-map-scrollbar-clearance))_/_2))] z-20 grid h-12 w-6 -translate-y-1/2 place-items-center p-0! max-editor:hidden ${positionClassName}`}
      aria-controls={controls}
      aria-expanded={expanded}
      aria-label={`${label} ${action}`}
      onClick={onToggle}
      title={`${label} ${action}`}
    >
      <Icon aria-hidden="true" size={14} strokeWidth={2} />
    </button>
  )
}
