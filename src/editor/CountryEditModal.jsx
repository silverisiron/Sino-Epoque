import { useState } from 'react'
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
  powerRankTypes,
}) {
  const [draft, setDraft] = useState({ ...country })
  const autonomyType = autonomyTypes[draft.autonomyTypeId] ?? autonomyTypes.independent
  const powerRankType =
    powerRankTypes[draft.powerRankTypeId] ?? powerRankTypes.decentralized
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
  const overlordIsInvalid =
    requiresOverlord && !availableOverlords.includes(draft.overlordId)
  const isInvalid =
    !draft.name.trim() ||
    colorIsUsed ||
    overlordIsInvalid

  function handleAutonomyTypeChange(autonomyTypeId) {
    const nextType = autonomyTypes[autonomyTypeId]
    setDraft((currentDraft) => ({
      ...currentDraft,
      autonomyTypeId,
      overlordId: nextType.autonomy === 10 ? null : currentDraft.overlordId,
    }))
  }

  function applyChanges() {
    return !isInvalid && onApply({ ...draft, name: draft.name.trim() })
  }

  function updateDraft(nextFields) {
    setDraft((currentDraft) => ({ ...currentDraft, ...nextFields }))
  }

  return (
    <EditorModal
      applyDisabled={isInvalid}
      labelledBy="country-edit-title"
      onApply={applyChanges}
      onClose={onClose}
      title="국가 편집"
    >
      <label>
        국가 이름
        <input
          value={draft.name}
          onChange={(event) => updateDraft({ name: event.target.value })}
        />
      </label>

      <label>
        국가 색상
        <input
          type="color"
          value={draft.color}
          onChange={(event) => updateDraft({ color: event.target.value })}
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
        국가 등급
        <select
          value={draft.powerRankTypeId}
          onChange={(event) => updateDraft({ powerRankTypeId: event.target.value })}
        >
          {Object.entries(powerRankTypes)
            .sort(([, left], [, right]) => right.level - left.level)
            .map(([typeId, type]) => (
              <option key={typeId} value={typeId}>
                {type.level} · {type.name} ({type.englishName || typeId})
              </option>
            ))}
        </select>
      </label>

      <label>
        국가 등급 수치
        <output>{powerRankType.level} / 10</output>
      </label>

      <label>
        종주국
        <select
          aria-describedby={overlordIsInvalid ? 'overlord-validation-message' : undefined}
          disabled={!requiresOverlord}
          required={requiresOverlord}
          value={draft.overlordId ?? ''}
          onChange={(event) => updateDraft({ overlordId: event.target.value || null })}
        >
          <option value="">선택</option>
          {availableOverlords.map((overlordId) => (
            <option key={overlordId} value={overlordId}>
              {countries[overlordId].name}
            </option>
          ))}
        </select>
      </label>

      {overlordIsInvalid ? (
        <p className="text-[#b42318]" id="overlord-validation-message">
          자치도 10 미만 유형은 종주국을 선택해야 적용할 수 있습니다.
        </p>
      ) : null}

      {colorIsUsed ? <p className="text-[#b42318]">이미 사용 중인 색상입니다.</p> : null}
    </EditorModal>
  )
}
