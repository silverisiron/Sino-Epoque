import Trash2 from 'lucide-react/dist/esm/icons/trash-2.mjs'
import { useState } from 'react'
import { PanelSection } from './PanelSection'

function NumericTypeRow({
  inUse,
  isSelected,
  onDelete,
  onSelectedChange,
  onUpdate,
  type,
  typeId,
  valueKey,
  valueLabel,
}) {
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_52px_auto] items-center gap-1.5 [&>input]:min-w-0">
      <input
        aria-label={`${type.name || typeId} 선택`}
        className="size-4"
        type="checkbox"
        checked={isSelected}
        onChange={(event) => onSelectedChange(typeId, event.target.checked)}
      />
      <input
        aria-label={`${valueLabel} 이름`}
        value={type.name}
        onBlur={() =>
          onUpdate(typeId, { ...type, name: type.name.trim() || typeId })
        }
        onChange={(event) => onUpdate(typeId, { ...type, name: event.target.value })}
      />
      <input
        aria-label={`${valueLabel} 영문 이름`}
        value={type.englishName}
        onBlur={() =>
          onUpdate(typeId, { ...type, englishName: type.englishName.trim() })
        }
        onChange={(event) =>
          onUpdate(typeId, { ...type, englishName: event.target.value })
        }
      />
      <input
        aria-label={`${valueLabel} 수치`}
        type="number"
        min="1"
        max="10"
        value={type[valueKey]}
        onChange={(event) =>
          onUpdate(typeId, { ...type, [valueKey]: event.target.value })
        }
      />
      <button
        type="button"
        aria-label={`${type.name || typeId} 삭제`}
        className="grid size-8 min-h-8 place-items-center p-0"
        disabled={inUse}
        title={inUse ? '사용 중이거나 마지막 남은 항목입니다.' : '삭제'}
        onClick={() => {
          if (onDelete(typeId)) {
            onSelectedChange(typeId, false)
          }
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

export function NumericTypePanel({
  heading,
  headingId,
  isInUse,
  onAdd,
  onDelete,
  onDeleteSelected,
  onUpdate,
  types,
  valueKey,
  valueLabel,
}) {
  const [selectedTypeIds, setSelectedTypeIds] = useState([])
  const typeEntries = Object.entries(types).sort(
    ([, left], [, right]) => right[valueKey] - left[valueKey],
  )
  const validSelectedTypeIds = selectedTypeIds.filter((typeId) => types[typeId])
  const allSelected =
    typeEntries.length > 0 && validSelectedTypeIds.length === typeEntries.length

  function toggleType(typeId, isSelected) {
    setSelectedTypeIds((currentIds) => {
      const nextIds = new Set(currentIds)

      if (isSelected) {
        nextIds.add(typeId)
      } else {
        nextIds.delete(typeId)
      }

      return [...nextIds]
    })
  }

  function toggleAll(isSelected) {
    setSelectedTypeIds(isSelected ? typeEntries.map(([typeId]) => typeId) : [])
  }

  function deleteSelectedTypes() {
    onDeleteSelected(validSelectedTypeIds)
    setSelectedTypeIds([])
  }

  return (
    <PanelSection headingId={headingId} onAction={onAdd} title={heading}>
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-2">
          <input
            aria-label={`${valueLabel} 전체 선택`}
            className="size-4"
            type="checkbox"
            checked={allSelected}
            onChange={(event) => toggleAll(event.target.checked)}
          />
          전체 선택
        </label>
        <button
          type="button"
          aria-label={`선택한 ${valueLabel} 삭제`}
          className="grid size-8 min-h-8 place-items-center p-0"
          disabled={validSelectedTypeIds.length === 0}
          title="선택 항목 삭제"
          onClick={deleteSelectedTypes}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="scrollbar-custom grid max-h-[32vh] list-none gap-1.5 overflow-y-auto">
        {typeEntries.map(([typeId, type]) => (
            <NumericTypeRow
              inUse={isInUse(typeId)}
              isSelected={validSelectedTypeIds.includes(typeId)}
              key={typeId}
              onDelete={onDelete}
              onSelectedChange={toggleType}
              onUpdate={onUpdate}
              type={type}
              typeId={typeId}
              valueKey={valueKey}
              valueLabel={valueLabel}
            />
          ))}
      </ul>
    </PanelSection>
  )
}
