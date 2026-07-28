import { useId } from 'react'
import { PanelCollapseButton } from './PanelCollapseButton'

const PANEL_LAYOUT_CLASS_NAME =
  'pointer-events-none grid min-h-0 min-w-0 min-[56.25rem]:col-start-1 min-[56.25rem]:row-start-2 min-[56.25rem]:z-10 min-[56.25rem]:w-80'

const CONTENT_LAYOUT_CLASS_NAME =
  'scrollbar-custom pointer-events-auto grid gap-3 min-h-0 min-w-0 content-start min-[56.25rem]:overflow-y-auto'

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
