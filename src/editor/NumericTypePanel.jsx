import { useState } from 'react'
import { DataManager } from './DataManager'

function NumericTypeRow({ inUse, onDelete, onUpdate, type, typeId, valueKey, valueLabel }) {
  const [draft, setDraft] = useState({ ...type })
  const normalizedDraft = {
    name: draft.name.trim() || typeId,
    englishName: draft.englishName.trim(),
    [valueKey]: Math.min(10, Math.max(1, Number.parseInt(draft[valueKey], 10) || 1)),
  }
  const hasChanges =
    normalizedDraft.name !== type.name ||
    normalizedDraft.englishName !== type.englishName ||
    normalizedDraft[valueKey] !== type[valueKey]

  function applyChanges() {
    if (onUpdate(typeId, normalizedDraft)) {
      setDraft(normalizedDraft)
    }
  }

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_52px_auto_auto] items-center gap-1.5 border border-[#d5dbe3] p-1.5 [&>input]:min-w-0">
      <input
        aria-label={`${valueLabel} 이름`}
        value={draft.name}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
        }
      />
      <input
        aria-label={`${valueLabel} 영문 이름`}
        value={draft.englishName}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, englishName: event.target.value }))
        }
      />
      <input
        aria-label={`${valueLabel} 수치`}
        type="number"
        min="1"
        max="10"
        value={draft[valueKey]}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, [valueKey]: event.target.value }))
        }
      />
      <button type="button" disabled={!hasChanges} onClick={applyChanges}>
        적용
      </button>
      <button type="button" disabled={inUse} onClick={() => onDelete(typeId)}>
        삭제
      </button>
    </li>
  )
}

export function NumericTypePanel({
  heading,
  isInUse,
  onAdd,
  onDelete,
  onUpdate,
  summary,
  types,
  valueKey,
  valueLabel,
}) {
  return (
    <DataManager heading={heading} onAdd={onAdd} summary={summary}>
      <ul className="mt-2.5 grid max-h-[32vh] list-none gap-1.5 overflow-y-auto p-0">
        {Object.entries(types)
          .sort(([, left], [, right]) => right[valueKey] - left[valueKey])
          .map(([typeId, type]) => (
            <NumericTypeRow
              inUse={isInUse(typeId)}
              key={`${typeId}:${type.name}:${type.englishName}:${type[valueKey]}`}
              onDelete={onDelete}
              onUpdate={onUpdate}
              type={type}
              typeId={typeId}
              valueKey={valueKey}
              valueLabel={valueLabel}
            />
          ))}
      </ul>
    </DataManager>
  )
}
