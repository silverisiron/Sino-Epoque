import { PanelHeader } from './PanelHeader'

export function PanelSection({
  actionLabel,
  children,
  className = 'bg-gray-700',
  headingId,
  onAction,
  title,
}) {
  return (
    <section className={className} aria-labelledby={headingId}>
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
