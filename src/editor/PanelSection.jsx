function PanelHeader({ actionLabel = '추가', headingId, onAction, title }) {
  return (
    <header className="flex min-h-8 items-center justify-between gap-3">
      <h2 id={headingId}>{title}</h2>
      {onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </header>
  )
}

export function PanelSection({
  actionLabel,
  children,
  className,
  headingId,
  onAction,
  title,
}) {
  return (
    <section
      className={cn(PANEL_SECTION_CLASS_NAME, className)}
      aria-labelledby={headingId}
    >
      <PanelHeader
        actionLabel={actionLabel}
        headingId={headingId}
        onAction={onAction}
        title={title}
      />
      {children}
    </section>
  )
}
import { cn } from '../lib/utils'

const PANEL_SECTION_CLASS_NAME =
  'bg-bg-sub/90 text-text-primary backdrop-blur-md p-3 flex flex-col gap-2 in-data-[side=right]:rounded-l-lg in-data-[side=left]:rounded-r-lg'
