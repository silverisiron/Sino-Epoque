import { useState } from 'react'
import { DataManager } from './DataManager'
import { PowerBlocEditModal } from './PowerBlocEditModal'

export function PowerBlocPanel({
  autonomyTypes,
  countries,
  countryOrder,
  onAdd,
  onDelete,
  onUpdate,
  powerBlocs,
  powerRankTypes,
}) {
  const [editingBlocId, setEditingBlocId] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const editingBloc = editingBlocId ? powerBlocs[editingBlocId] : null

  return (
    <DataManager
      heading="Power Blocs"
      headingId="power-blocs-title"
      onAdd={() => setIsAdding(true)}
    >
      <ul className="grid max-h-[32vh] list-none gap-1.5 overflow-y-auto">
        {Object.entries(powerBlocs).map(([blocId, bloc]) => (
          <li
            className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5"
            key={blocId}
          >
            <span className="grid min-w-0">
              <strong>{bloc.name}</strong>
              <small className="truncate text-muted">
                {countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId}
              </small>
            </span>
            <button type="button" onClick={() => setEditingBlocId(blocId)}>
              편집
            </button>
            <button type="button" onClick={() => onDelete(blocId)}>
              삭제
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
    </DataManager>
  )
}
