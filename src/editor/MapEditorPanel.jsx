import { useId } from 'react'
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left.mjs'
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right.mjs'

const PANEL_LAYOUT_CLASS_NAME =
  'pointer-events-none grid min-h-0 min-w-0 min-[56.25rem]:col-start-1 min-[56.25rem]:row-start-2 min-[56.25rem]:z-10 min-[56.25rem]:w-80'

const CONTENT_LAYOUT_CLASS_NAME =
  'scrollbar-custom pointer-events-auto grid gap-3 min-h-0 min-w-0 content-start min-[56.25rem]:overflow-y-auto'

function PanelCollapseButton({
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

export function MapEditorPanel({
  children,
  expanded,
  label,
  onToggle,
  side,
}) {
  const contentId = useId()
  const isLeftPanel = side === 'left'
  const toggleLabel = isLeftPanel ? '왼쪽 패널' : '오른쪽 패널'
  const panelSideClassName = isLeftPanel
    ? 'min-[56.25rem]:justify-self-start'
    : 'min-[56.25rem]:justify-self-end'
  const contentStateClassName = expanded ? '' : 'min-[56.25rem]:hidden'

  return (
    <section
      className={`${PANEL_LAYOUT_CLASS_NAME} ${panelSideClassName}`}
      data-expanded={expanded}
      data-side={side}
      aria-label={label}
    >
      <div
        className={`${CONTENT_LAYOUT_CLASS_NAME} ${contentStateClassName}`}
        id={contentId}
      >
        {children}
      </div>

      <PanelCollapseButton
        controls={contentId}
        expanded={expanded}
        label={toggleLabel}
        onToggle={onToggle}
        side={side}
      />
    </section>
  )
}
