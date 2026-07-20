import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { EditorModal } from './EditorModal'

function createsOverlordCycle(countryId, overlordId, countries) {
  const visited = new Set()
  let currentCountryId = overlordId

  while (currentCountryId) {
    if (currentCountryId === countryId || visited.has(currentCountryId)) {
      return true
    }

    visited.add(currentCountryId)
    currentCountryId = countries[currentCountryId]?.overlordId ?? null
  }

  return false
}

export function CountryEditModal({
  autonomyTypes,
  countries,
  country,
  countryId,
  countryOrder,
  onApply,
  onClose,
}) {
  const [draft, setDraft] = useState({ ...country })
  const autonomyType = autonomyTypes[draft.autonomyTypeId] ?? autonomyTypes.independent
  const requiresOverlord = autonomyType.autonomy < 10
  const colorIsUsed = Object.entries(countries).some(
    ([otherCountryId, otherCountry]) =>
      otherCountryId !== countryId &&
      otherCountry.color.toLowerCase() === draft.color.toLowerCase(),
  )
  const availableOverlords = countryOrder.filter(
    (otherCountryId) =>
      otherCountryId !== countryId &&
      countries[otherCountryId] &&
      !createsOverlordCycle(countryId, otherCountryId, countries),
  )
  const isInvalid =
    !draft.name.trim() ||
    colorIsUsed ||
    (requiresOverlord && !availableOverlords.includes(draft.overlordId))

  function handleAutonomyTypeChange(autonomyTypeId) {
    const nextType = autonomyTypes[autonomyTypeId]
    setDraft((currentDraft) => ({
      ...currentDraft,
      autonomyTypeId,
      overlordId: nextType.autonomy === 10 ? null : currentDraft.overlordId,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!isInvalid && onApply({ ...draft, name: draft.name.trim() })) {
      onClose()
    }
  }

  return (
    <EditorModal labelledBy="country-edit-title" onClose={onClose}>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <header className={styles.modalHeader}>
            <h2 id="country-edit-title">국가 편집</h2>
            <div className={styles.modalActions}>
              <button type="submit" disabled={isInvalid}>
                적용
              </button>
              <button type="button" aria-label="닫기" onClick={onClose}>
                ×
              </button>
            </div>
          </header>

          <label>
            국가 이름
            <input
              value={draft.name}
              onChange={(event) =>
                setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
              }
            />
          </label>

          <label>
            국가 색상
            <input
              type="color"
              value={draft.color}
              onChange={(event) =>
                setDraft((currentDraft) => ({ ...currentDraft, color: event.target.value }))
              }
            />
          </label>

          <label>
            자치도 유형
            <select
              value={draft.autonomyTypeId}
              onChange={(event) => handleAutonomyTypeChange(event.target.value)}
            >
              {Object.entries(autonomyTypes)
                .sort(([, left], [, right]) => right.autonomy - left.autonomy)
                .map(([typeId, type]) => (
                  <option key={typeId} value={typeId}>
                    {type.autonomy} · {type.name} ({type.englishName || typeId})
                  </option>
                ))}
            </select>
          </label>

          <label>
            자치도 수치
            <output>{autonomyType.autonomy} / 10</output>
          </label>

          <label>
            종주국
            <select
              disabled={!requiresOverlord}
              required={requiresOverlord}
              value={draft.overlordId ?? ''}
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  overlordId: event.target.value || null,
                }))
              }
            >
              <option value="">선택</option>
              {availableOverlords.map((overlordId) => (
                <option key={overlordId} value={overlordId}>
                  {countries[overlordId].name}
                </option>
              ))}
            </select>
          </label>

          {colorIsUsed ? <p className={styles.validationMessage}>이미 사용 중인 색상입니다.</p> : null}
        </form>
    </EditorModal>
  )
}
