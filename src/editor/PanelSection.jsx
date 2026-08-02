import { PanelHeader } from './PanelHeader'

export function PanelSection({
  actionLabel,
  children,
  className = 'bg-bg-sub/90 text-text-primary backdrop-blur-md p-3 flex flex-col gap-2',
  headingId,
  onAction,
  title,
}) {
  return (
    <section
      className={`${className} in-data-[side=right]:rounded-l-lg in-data-[side=left]:rounded-r-lg`}
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
