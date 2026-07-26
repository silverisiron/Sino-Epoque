import { PanelHeader } from './PanelHeader'

export function DataManager({ addLabel = '추가', children, heading, headingId, onAdd }) {
  return (
    <section
      aria-labelledby={headingId}
    >
      <PanelHeader
        actionLabel={addLabel}
        headingId={headingId}
        onAction={onAdd}
        title={heading}
      />
      {children}
    </section>
  )
}
