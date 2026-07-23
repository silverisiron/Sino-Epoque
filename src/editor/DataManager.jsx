import { PanelHeader } from './PanelHeader'

export function DataManager({ addLabel = '추가', children, heading, onAdd, summary }) {
  return (
    <details className="mt-3 border-t border-[#d5dbe3] pt-3 open:[&>summary]:mb-3">
      <summary className="cursor-pointer text-sm font-semibold">{summary}</summary>
      <PanelHeader actionLabel={addLabel} onAction={onAdd} title={heading} />
      {children}
    </details>
  )
}
