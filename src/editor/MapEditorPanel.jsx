import { useId } from 'react'
import { PanelCollapseButton } from './PanelCollapseButton'

const PANEL_LAYOUT_CLASS_NAME =
  'pointer-events-none grid min-h-0 min-w-0 editor:col-start-1 editor:row-start-2 editor:z-10 editor:w-(--spacing-editor-sidebar)'

const CONTENT_LAYOUT_CLASS_NAME =
  'pointer-events-auto grid min-h-0 min-w-0 content-start editor:overflow-y-auto'

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
    ? 'editor:justify-self-start'
    : 'editor:justify-self-end'
  const contentStateClassName = expanded ? '' : 'editor:hidden'

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
