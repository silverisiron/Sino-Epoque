export function PanelHeader({ actionLabel = '추가', headingId, onAction, title }) {
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
