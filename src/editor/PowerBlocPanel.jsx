import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { PanelSection } from './PanelSection'
import { PowerBlocEditModal } from './PowerBlocEditModal'

export function PowerBlocPanel({
  autonomyTypes,
  countries,
  countryOrder,
  onAdd,
  onDelete,
  onDeleteSelected,
  onUpdate,
  powerBlocs,
  powerRankTypes,
}) {
  const [editingBlocId, setEditingBlocId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [selectedBlocIds, setSelectedBlocIds] = useState([])
  const editingBloc = editingBlocId ? powerBlocs[editingBlocId] : null
  const blocEntries = Object.entries(powerBlocs)
  const validSelectedBlocIds = selectedBlocIds.filter((blocId) => powerBlocs[blocId])
  const allSelected =
    blocEntries.length > 0 && validSelectedBlocIds.length === blocEntries.length

  function toggleBloc(blocId, isSelected) {
    setSelectedBlocIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (isSelected) {
        nextIds.add(blocId)
      } else {
        nextIds.delete(blocId)
      }

      return [...nextIds]
    })
  }

  function toggleAll(isSelected) {
    setSelectedBlocIds(isSelected ? blocEntries.map(([blocId]) => blocId) : [])
  }

  function deleteSelectedBlocs() {
    onDeleteSelected(validSelectedBlocIds)
    setSelectedBlocIds([])
  }

  return (
    <PanelSection
      headingId="power-blocs-title"
      onAction={() => setIsAdding(true)}
      title="Power Blocs"
    >
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2">
          <input
            aria-label="세력 블록 전체 선택"
            className="size-4"
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          전체 선택
        </label>
        <button
          type="button"
          aria-label="선택한 세력 블록 삭제"
          className="grid size-8 min-h-8 place-items-center p-0"
          disabled={validSelectedBlocIds.length === 0}
          title="선택 항목 삭제"
          onClick={deleteSelectedBlocs}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="scrollbar-custom grid max-h-[32vh] list-none gap-1.5 overflow-y-auto">
        {blocEntries.map(([blocId, bloc]) => (
          <li
            className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5"
            key={blocId}
          >
            <input
              aria-label={`${bloc.name || blocId} 선택`}
              className="size-4"
              type="checkbox"
              checked={validSelectedBlocIds.includes(blocId)}
              onChange={(event) => toggleBloc(blocId, event.target.checked)}
            />
            <span className="grid min-w-0">
              <strong>{bloc.name}</strong>
              <small className="truncate text-muted">
                {countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId}
              </small>
            </span>
            <button
              type="button"
              aria-label={`${bloc.name || blocId} 편집`}
              className="grid size-8 min-h-8 place-items-center p-0"
              title="편집"
              onClick={() => setEditingBlocId(blocId)}
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`${bloc.name || blocId} 삭제`}
              className="grid size-8 min-h-8 place-items-center p-0"
              title="삭제"
              onClick={() => {
                if (onDelete(blocId)) {
                  toggleBloc(blocId, false)
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      {isAdding ? (
        <PowerBlocEditModal
          autonomyTypes={autonomyTypes}
          countries={countries}
          countryOrder={countryOrder}
          onApply={onAdd}
          onClose={() => setIsAdding(false)}
          powerBlocs={powerBlocs}
          powerRankTypes={powerRankTypes}
        />
      ) : null}

      {editingBloc ? (
        <PowerBlocEditModal
          autonomyTypes={autonomyTypes}
          bloc={editingBloc}
          blocId={editingBlocId}
          countries={countries}
          countryOrder={countryOrder}
          onApply={(nextBloc) => onUpdate(editingBlocId, nextBloc)}
          onClose={() => setEditingBlocId(null)}
          powerBlocs={powerBlocs}
          powerRankTypes={powerRankTypes}
        />
      ) : null}
    </PanelSection>
  )
}
