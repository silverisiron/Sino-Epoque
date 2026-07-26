import { useId } from 'react'
import { PanelCollapseButton } from './PanelCollapseButton'

const PANEL_CLASS_NAME =
  'pointer-events-none grid min-h-0 min-w-0 editor:col-start-1 editor:row-start-2 editor:w-(--spacing-editor-sidebar)'

const CONTENT_CLASS_NAME =
  'pointer-events-auto grid min-h-0 min-w-0 content-start gap-4.5 overflow-y-auto overscroll-contain bg-white [transition:opacity_180ms_ease,visibility_0s_linear] motion-reduce:transition-none! max-editor:overflow-y-visible editor:z-10 editor:[transition:transform_300ms_ease-in-out,opacity_180ms_ease,visibility_0s_linear]'

const COLLAPSED_CONTENT_CLASS_NAME =
  'editor:invisible editor:pointer-events-none editor:opacity-0 editor:[transition:transform_300ms_ease-in-out,opacity_180ms_ease,visibility_0s_linear_300ms]'

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
  const collapsedSideClassName = isLeftPanel
    ? 'editor:-translate-x-full'
    : 'editor:translate-x-full'
  const contentStateClassName = expanded
    ? ''
    : `${COLLAPSED_CONTENT_CLASS_NAME} ${collapsedSideClassName}`

  return (
    <section
      className={`${PANEL_CLASS_NAME} ${panelSideClassName}`}
      data-expanded={expanded}
      data-side={side}
      aria-label={label}
    >
      <div
        className={`${CONTENT_CLASS_NAME} ${contentStateClassName}`}
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
