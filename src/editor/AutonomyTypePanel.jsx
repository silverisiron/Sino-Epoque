import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'

function AutonomyTypeRow({ inUse, onDelete, onUpdate, type, typeId }) {
  const [draft, setDraft] = useState({ ...type })

  const normalizedDraft = {
    name: draft.name.trim() || typeId,
    englishName: draft.englishName.trim(),
    autonomy: Math.min(10, Math.max(1, Number.parseInt(draft.autonomy, 10) || 1)),
    builtIn: false,
  }
  const hasChanges =
    normalizedDraft.name !== type.name ||
    normalizedDraft.englishName !== type.englishName ||
    normalizedDraft.autonomy !== type.autonomy

  function applyChanges() {
    if (onUpdate(typeId, normalizedDraft)) {
      setDraft(normalizedDraft)
    }
  }

  if (type.builtIn) {
    return (
      <li className={styles.autonomyTypeRow}>
        <span>{type.name}</span>
        <span>{type.englishName}</span>
        <strong>{type.autonomy}</strong>
      </li>
    )
  }

  return (
    <li className={styles.customAutonomyTypeRow}>
      <input
        aria-label="자치도 유형 이름"
        value={draft.name}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
        }
      />
      <input
        aria-label="자치도 유형 영문 이름"
        value={draft.englishName}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, englishName: event.target.value }))
        }
      />
      <input
        aria-label="자치도 수치"
        type="number"
        min="1"
        max="10"
        value={draft.autonomy}
        onChange={(event) =>
          setDraft((currentDraft) => ({ ...currentDraft, autonomy: event.target.value }))
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

export function AutonomyTypePanel({ autonomyTypes, countries, onAdd, onDelete, onUpdate }) {
  return (
    <details className={styles.autonomyManager}>
      <summary>자치도 유형 관리</summary>
      <div className={styles.sideHeader}>
        <h2>Autonomy Types</h2>
        <button type="button" onClick={onAdd}>
          추가
        </button>
      </div>
      <ul className={styles.autonomyTypeList}>
        {Object.entries(autonomyTypes)
          .sort(([, left], [, right]) => right.autonomy - left.autonomy)
          .map(([typeId, type]) => (
            <AutonomyTypeRow
              inUse={Object.values(countries).some((country) => country.autonomyTypeId === typeId)}
              key={`${typeId}:${type.name}:${type.englishName}:${type.autonomy}`}
              onDelete={onDelete}
              onUpdate={onUpdate}
              type={type}
              typeId={typeId}
            />
          ))}
      </ul>
    </details>
  )
}
