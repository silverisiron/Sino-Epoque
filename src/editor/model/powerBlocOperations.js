import {
  hasBlocMembershipConflict,
  isEligiblePowerBlocLeader,
} from '../../map/worldRelations'

function commandFailed(editorState, error = '') {
  return { editorState, error, ok: false }
}

export function createPowerBlocItems(powerBlocs, countries) {
  return Object.fromEntries(
    Object.entries(powerBlocs).map(([blocId, bloc]) => [
      blocId,
      {
        name: bloc.name,
        englishName:
          countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId,
      },
    ]),
  )
}

function savePowerBloc(editorState, blocId, blocChanges) {
  const leader = editorState.countries[blocChanges.leaderCountryId]

  if (
    !blocChanges.name.trim() ||
    !isEligiblePowerBlocLeader(
      leader,
      editorState.autonomyTypes,
      editorState.powerRankTypes,
    )
  ) {
    return commandFailed(
      editorState,
      '대표국은 독립국이며 국가 등급이 7 이상이어야 합니다.',
    )
  }

  const normalizedBloc = {
    name: blocChanges.name.trim(),
    leaderCountryId: blocChanges.leaderCountryId,
    memberCountryIds: [...new Set(blocChanges.memberCountryIds)].filter(
      (countryId) =>
        editorState.countries[countryId] &&
        countryId !== blocChanges.leaderCountryId,
    ),
  }
  const nextPowerBlocs = {
    ...editorState.powerBlocs,
    [blocId]: normalizedBloc,
  }

  if (
    hasBlocMembershipConflict(
      nextPowerBlocs,
      editorState.countries,
      editorState.autonomyTypes,
    )
  ) {
    return commandFailed(
      editorState,
      '한 국가는 하나의 세력 블록에만 가입할 수 있습니다.',
    )
  }

  return {
    editorState: { ...editorState, powerBlocs: nextPowerBlocs },
    ok: true,
    value: blocId,
  }
}

export function addPowerBloc(editorState, blocChanges) {
  let blocNumber = 1
  let blocId = `power_bloc_${blocNumber}`

  while (editorState.powerBlocs[blocId]) {
    blocNumber += 1
    blocId = `power_bloc_${blocNumber}`
  }

  return savePowerBloc(editorState, blocId, blocChanges)
}

export function updatePowerBloc(editorState, blocId, blocChanges) {
  return editorState.powerBlocs[blocId]
    ? savePowerBloc(editorState, blocId, blocChanges)
    : commandFailed(editorState)
}

export function deletePowerBlocs(editorState, blocIds) {
  const selectedBlocIds = new Set(blocIds)
  const deletedIds = Object.keys(editorState.powerBlocs).filter((blocId) =>
    selectedBlocIds.has(blocId),
  )

  if (deletedIds.length === 0) {
    return { deletedIds, editorState, ok: false }
  }

  const nextPowerBlocs = { ...editorState.powerBlocs }

  for (const blocId of deletedIds) {
    delete nextPowerBlocs[blocId]
  }

  return {
    deletedIds,
    editorState: { ...editorState, powerBlocs: nextPowerBlocs },
    ok: true,
  }
}
