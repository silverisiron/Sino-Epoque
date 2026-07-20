import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { createCountryBlocIndex, getAutomaticBlocMemberIds } from '../map/worldRelations'
import { EditorModal } from './EditorModal'

const EMPTY_BLOC = { name: '', leaderCountryId: '', memberCountryIds: [] }

export function PowerBlocEditModal({
  autonomyTypes,
  bloc = EMPTY_BLOC,
  blocId = null,
  countries,
  countryOrder,
  onApply,
  onClose,
  powerBlocs,
  powerRankTypes,
}) {
  const [draft, setDraft] = useState({ ...bloc, memberCountryIds: [...bloc.memberCountryIds] })
  const otherBlocs = Object.fromEntries(
    Object.entries(powerBlocs).filter(([otherBlocId]) => otherBlocId !== blocId),
  )
  const occupiedCountryIds = createCountryBlocIndex(otherBlocs, countries, autonomyTypes)
  const eligibleLeaderIds = countryOrder.filter((countryId) => {
    const country = countries[countryId]
    return (
      autonomyTypes[country?.autonomyTypeId]?.autonomy === 10 &&
      powerRankTypes[country?.powerRankTypeId]?.level >= 7 &&
      !occupiedCountryIds.has(countryId)
    )
  })
  const automaticMemberIds = draft.leaderCountryId
    ? getAutomaticBlocMemberIds(draft.leaderCountryId, countries, autonomyTypes)
    : new Set()
  const isInvalid =
    !draft.name.trim() || !eligibleLeaderIds.includes(draft.leaderCountryId)

  function toggleMember(countryId) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      memberCountryIds: currentDraft.memberCountryIds.includes(countryId)
        ? currentDraft.memberCountryIds.filter((memberId) => memberId !== countryId)
        : [...currentDraft.memberCountryIds, countryId],
    }))
  }

  function applyChanges() {
    return onApply({
      name: draft.name.trim(),
      leaderCountryId: draft.leaderCountryId,
      memberCountryIds: draft.memberCountryIds.filter(
        (countryId) =>
          countryId !== draft.leaderCountryId &&
          !automaticMemberIds.has(countryId) &&
          !occupiedCountryIds.has(countryId),
      ),
    })
  }

  return (
    <EditorModal
      applyDisabled={isInvalid}
      labelledBy="power-bloc-edit-title"
      onApply={applyChanges}
      onClose={onClose}
      title={blocId ? '세력 블록 편집' : '세력 블록 추가'}
    >
      <label>
        세력 블록 이름
        <input
          value={draft.name}
          onChange={(event) =>
            setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
          }
        />
      </label>

      <label>
        대표국
        <select
          value={draft.leaderCountryId}
          onChange={(event) =>
            setDraft((currentDraft) => ({
              ...currentDraft,
              leaderCountryId: event.target.value,
            }))
          }
        >
          <option value="">선택</option>
          {eligibleLeaderIds.map((countryId) => (
            <option key={countryId} value={countryId}>
              {countries[countryId].name}
            </option>
          ))}
        </select>
      </label>

      <fieldset className={styles.blocMemberFieldset}>
        <legend>회원국</legend>
        <div className={styles.blocMemberList}>
          {countryOrder
            .filter((countryId) => countryId !== draft.leaderCountryId)
            .map((countryId) => {
              const isAutomatic = automaticMemberIds.has(countryId)
              const isOccupied = occupiedCountryIds.has(countryId)

              return (
                <label key={countryId}>
                  <input
                    type="checkbox"
                    checked={isAutomatic || draft.memberCountryIds.includes(countryId)}
                    disabled={isAutomatic || isOccupied}
                    onChange={() => toggleMember(countryId)}
                  />
                  <span>{countries[countryId].name}</span>
                  <small>{isAutomatic ? '자동' : isOccupied ? '다른 블록' : '수동'}</small>
                </label>
              )
            })}
        </div>
      </fieldset>
    </EditorModal>
  )
}
