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
      ? 'left-80'
      : 'left-0'
    : expanded
      ? 'right-80'
      : 'right-0'
  const CollapseIcon = isLeftPanel ? ChevronLeft : ChevronRight
  const ExpandIcon = isLeftPanel ? ChevronRight : ChevronLeft
  const Icon = expanded ? CollapseIcon : ExpandIcon
  const action = expanded ? '접기' : '펼치기'

  return (
    <button
      type="button"
      className={`pointer-events-auto absolute top-[calc(50%+0.625rem)] z-20 grid h-12 w-6 -translate-y-1/2 place-items-center p-0! max-[56.25rem]:hidden ${positionClassName}`}
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
