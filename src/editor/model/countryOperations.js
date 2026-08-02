import {
  DEFAULT_AUTONOMY_TYPE_ID,
  DEFAULT_POWER_RANK_TYPE_ID,
  getAvailableTypeId,
} from '../../map/presetSchema'
import {
  hasBlocMembershipConflict,
  wouldCreateOverlordCycle,
} from '../../map/worldRelations'

function commandFailed(editorState, error = '') {
  return { editorState, error, ok: false }
}

function commandSucceeded(editorState, value) {
  return { editorState, ok: true, value }
}

function createAvailableCountryId(countries, countryOrder) {
  let countryNumber = countryOrder.length + 1
  let countryId = `country_${countryNumber}`

  while (countries[countryId]) {
    countryNumber += 1
    countryId = `country_${countryNumber}`
  }

  return { countryId, countryNumber }
}

function createAvailableCountryColor(countries) {
  const usedColors = new Set(
    Object.values(countries).map((country) => country.color.toLowerCase()),
  )
  let color = '#4f46e5'
  let colorStep = 0

  while (usedColors.has(color)) {
    colorStep += 1
    color = `#${((0x4f46e5 + colorStep * 0x12345) & 0xffffff)
      .toString(16)
      .padStart(6, '0')}`
  }

  return color
}

export function addCountry(editorState) {
  const { countries, countryOrder, autonomyTypes, powerRankTypes } = editorState
  const { countryId, countryNumber } = createAvailableCountryId(
    countries,
    countryOrder,
  )
  const country = {
    name: `국가 ${countryNumber}`,
    color: createAvailableCountryColor(countries),
    autonomyTypeId: getAvailableTypeId(
      autonomyTypes,
      DEFAULT_AUTONOMY_TYPE_ID,
      'autonomy',
      true,
    ),
    powerRankTypeId: getAvailableTypeId(
      powerRankTypes,
      DEFAULT_POWER_RANK_TYPE_ID,
      'level',
      false,
    ),
    overlordId: null,
  }

  return commandSucceeded(
    {
      ...editorState,
      activeCountryId: countryId,
      countries: { ...countries, [countryId]: country },
      countryOrder: [...countryOrder, countryId],
    },
    countryId,
  )
}

export function updateCountry(editorState, countryId, countryChanges) {
  const {
    autonomyTypes,
    countries,
    powerBlocs,
    powerRankTypes,
  } = editorState
  const currentCountry = countries[countryId]

  if (!currentCountry) {
    return commandFailed(editorState)
  }

  const autonomyType = autonomyTypes[countryChanges.autonomyTypeId]
  const powerRankType = powerRankTypes[countryChanges.powerRankTypeId]
  const normalizedColor = countryChanges.color.toLowerCase()
  const colorIsUsed = Object.entries(countries).some(
    ([otherCountryId, country]) =>
      otherCountryId !== countryId &&
      country.color.toLowerCase() === normalizedColor,
  )

  if (!autonomyType || !powerRankType || colorIsUsed) {
    return commandFailed(
      editorState,
      colorIsUsed
        ? '이미 사용 중인 국가 색상입니다.'
        : '유효하지 않은 자치도 유형 또는 국가 등급입니다.',
    )
  }

  const overlordId = autonomyType.autonomy < 10 ? countryChanges.overlordId : null

  if (
    autonomyType.autonomy < 10 &&
    (!overlordId ||
      !countries[overlordId] ||
      wouldCreateOverlordCycle(countryId, overlordId, countries))
  ) {
    return commandFailed(
      editorState,
      '종속국은 순환되지 않는 유효한 종주국을 선택해야 합니다.',
    )
  }

  const isBlocLeader = Object.values(powerBlocs).some(
    (bloc) => bloc.leaderCountryId === countryId,
  )

  if (isBlocLeader && (autonomyType.autonomy !== 10 || powerRankType.level < 7)) {
    return commandFailed(
      editorState,
      '세력 블록 대표국은 독립국이며 국가 등급이 7 이상이어야 합니다.',
    )
  }

  const nextCountries = {
    ...countries,
    [countryId]: {
      ...currentCountry,
      ...countryChanges,
      color: normalizedColor,
      overlordId,
    },
  }

  if (hasBlocMembershipConflict(powerBlocs, nextCountries, autonomyTypes)) {
    return commandFailed(
      editorState,
      '변경하면 한 국가가 여러 세력 블록에 속하게 됩니다.',
    )
  }

  return commandSucceeded({ ...editorState, countries: nextCountries }, countryId)
}

export function deleteCountry(editorState, countryId) {
  const {
    activeCountryId,
    autonomyTypes,
    countries,
    countryOrder,
    powerBlocs,
    provinceAssignments,
  } = editorState

  if (!countries[countryId]) {
    return commandFailed(editorState)
  }

  const deletedIndex = countryOrder.indexOf(countryId)
  const nextCountryOrder = countryOrder.filter(
    (orderedId) => orderedId !== countryId,
  )
  const nextActiveCountryId =
    activeCountryId === countryId
      ? nextCountryOrder[Math.min(deletedIndex, nextCountryOrder.length - 1)] ?? ''
      : activeCountryId
  const fallbackAutonomyTypeId = getAvailableTypeId(
    autonomyTypes,
    DEFAULT_AUTONOMY_TYPE_ID,
    'autonomy',
    true,
  )
  const nextCountries = {}

  for (const [otherCountryId, country] of Object.entries(countries)) {
    if (otherCountryId === countryId) {
      continue
    }

    nextCountries[otherCountryId] =
      country.overlordId === countryId
        ? {
            ...country,
            autonomyTypeId: fallbackAutonomyTypeId,
            overlordId: null,
          }
        : country
  }

  const nextProvinceAssignments = Object.fromEntries(
    Object.entries(provinceAssignments).filter(
      ([, assignedCountryId]) => assignedCountryId !== countryId,
    ),
  )
  const nextPowerBlocs = Object.fromEntries(
    Object.entries(powerBlocs).flatMap(([blocId, bloc]) =>
      bloc.leaderCountryId === countryId
        ? []
        : [
            [
              blocId,
              {
                ...bloc,
                memberCountryIds: bloc.memberCountryIds.filter(
                  (memberCountryId) => memberCountryId !== countryId,
                ),
              },
            ],
          ],
    ),
  )

  return commandSucceeded(
    {
      ...editorState,
      activeCountryId: nextActiveCountryId,
      countries: nextCountries,
      countryOrder: nextCountryOrder,
      powerBlocs: nextPowerBlocs,
      provinceAssignments: nextProvinceAssignments,
    },
    countryId,
  )
}

export function reorderCountries(editorState, orderedCountryIds) {
  const knownCountryIds = new Set(Object.keys(editorState.countries))
  const nextCountryOrder = orderedCountryIds.filter((countryId) =>
    knownCountryIds.has(countryId),
  )
  const orderIsUnchanged = nextCountryOrder.every(
    (countryId, index) => editorState.countryOrder[index] === countryId,
  )

  if (orderIsUnchanged) {
    return commandSucceeded(editorState)
  }

  return commandSucceeded({ ...editorState, countryOrder: nextCountryOrder })
}
