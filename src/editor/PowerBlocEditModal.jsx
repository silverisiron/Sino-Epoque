import { useState } from 'react'
import {
  createCountryBlocIndex,
  getAutomaticBlocMemberIds,
  isEligiblePowerBlocLeader,
} from '../map/worldRelations'
import { EditorModal } from './EditorModal'
import { SelectAllButton } from './SelectAllButton'

const EMPTY_BLOC = { name: '', leaderCountryId: '', memberCountryIds: [] }

export function PowerBlocEditModal({
  autonomyTypes,
  bloc = EMPTY_BLOC,
  blocId = null,
  countries,
  countryOrder,
  onClose,
  powerBlocs,
  powerRankTypes,
  savePowerBloc,
}) {
  const [draft, setDraft] = useState({ ...bloc, memberCountryIds: [...bloc.memberCountryIds] })
  const otherBlocs = Object.fromEntries(
    Object.entries(powerBlocs).filter(([otherBlocId]) => otherBlocId !== blocId),
  )
  const occupiedCountryIds = createCountryBlocIndex(otherBlocs, countries, autonomyTypes)
  const eligibleLeaderIds = countryOrder.filter((countryId) => {
    const country = countries[countryId]
    return (
      isEligiblePowerBlocLeader(country, autonomyTypes, powerRankTypes) &&
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

  function submitPowerBloc() {
    return savePowerBloc({
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

  function toggleAllMembers() {
    const selectableCountryIds = countryOrder.filter(
      (countryId) =>
        countryId !== draft.leaderCountryId &&
        !automaticMemberIds.has(countryId) &&
        !occupiedCountryIds.has(countryId),
    )
    const shouldSelectAll = selectableCountryIds.some(
      (countryId) => !draft.memberCountryIds.includes(countryId),
    )

    setDraft((currentDraft) => {
      const selectableIds = new Set(selectableCountryIds)
      const retainedMemberIds = currentDraft.memberCountryIds.filter(
        (countryId) => !selectableIds.has(countryId),
      )

      return {
        ...currentDraft,
        memberCountryIds: shouldSelectAll
          ? [...retainedMemberIds, ...selectableCountryIds]
          : retainedMemberIds,
      }
    })
  }

  return (
    <EditorModal
      labelledBy="power-bloc-edit-title"
      onClose={onClose}
      onSubmit={submitPowerBloc}
      submitDisabled={isInvalid}
      title={blocId ? '세력 블록 편집' : '세력 블록 추가'}
    >
      <SelectAllButton onToggle={toggleAllMembers} />

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

      <fieldset className="min-w-0">
        <legend className="text-sm font-semibold">회원국</legend>
        <div className="scrollbar-custom grid max-h-[36vh] gap-1 overflow-y-auto">
          {countryOrder
            .filter((countryId) => countryId !== draft.leaderCountryId)
            .map((countryId) => {
              const isAutomatic = automaticMemberIds.has(countryId)
              const isOccupied = occupiedCountryIds.has(countryId)

              return (
                <label
                  className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center"
                  key={countryId}
                >
                  <input
                    className="min-h-0!"
                    type="checkbox"
                    checked={isAutomatic || draft.memberCountryIds.includes(countryId)}
                    disabled={isAutomatic || isOccupied}
                    onChange={() => toggleMember(countryId)}
                  />
                  <span>{countries[countryId].name}</span>
                  <small className="text-muted">
                    {isAutomatic ? '자동' : isOccupied ? '다른 블록' : '수동'}
                  </small>
                </label>
              )
            })}
        </div>
      </fieldset>
    </EditorModal>
  )
}
