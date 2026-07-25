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
    ? 'left-[var(--left-panel-width)] border-l-0'
    : 'right-[var(--right-panel-width)] border-r-0'
  const CollapseIcon = isLeftPanel ? ChevronLeft : ChevronRight
  const ExpandIcon = isLeftPanel ? ChevronRight : ChevronLeft
  const Icon = expanded ? CollapseIcon : ExpandIcon
  const action = expanded ? '접기' : '펼치기'

  return (
    <button
      type="button"
      className={`absolute top-[var(--panel-toggle-top)] z-20 grid h-12 w-6 min-h-0! -translate-y-1/2 place-items-center p-0! transition-[left,right] duration-300 ease-in-out motion-reduce:transition-none max-editor:hidden ${positionClassName}`}
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
