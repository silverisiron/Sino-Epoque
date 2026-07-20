import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
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
      onAdd={() => setIsAdding(true)}
      summary="세력 블록 관리"
    >
      <ul className={styles.powerBlocList}>
        {Object.entries(powerBlocs).map(([blocId, bloc]) => (
          <li className={styles.powerBlocRow} key={blocId}>
            <span>
              <strong>{bloc.name}</strong>
              <small>{countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId}</small>
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
