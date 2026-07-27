import { PanelHeader } from './PanelHeader'

export function PanelSection({
  actionLabel,
  children,
  className = 'bg-gray-700/50 backdrop-blur-lg rounded-xl p-3 flex flex-col gap-2',
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
