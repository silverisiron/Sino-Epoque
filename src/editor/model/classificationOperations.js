import {
  DEFAULT_AUTONOMY_TYPE_ID,
  DEFAULT_POWER_RANK_TYPE_ID,
} from '../../map/presetSchema'

function commandFailed(editorState, error) {
  return { deletedIds: [], editorState, error, ok: false }
}

function commandSucceeded(editorState, value = undefined) {
  return { editorState, ok: true, value }
}

function createCustomNumericType(types, name, valueKey, value) {
  let typeNumber = 1
  let typeId = `custom_${typeNumber}`

  while (types[typeId]) {
    typeNumber += 1
    typeId = `custom_${typeNumber}`
  }

  return {
    type: {
      name: `${name} ${typeNumber}`,
      englishName: '',
      [valueKey]: value,
    },
    typeId,
  }
}

function normalizeScale(value) {
  return Math.min(10, Math.max(1, Number.parseInt(value, 10) || 1))
}

function deleteUnusedTypes({
  editorState,
  requestedTypeIds,
  typesKey,
  countryTypeIdKey,
  preferredTypeId,
}) {
  const types = editorState[typesKey]
  const selectedTypeIds = new Set(requestedTypeIds)
  const allTypeIds = Object.keys(types)
  let deletableTypeIds = allTypeIds.filter(
    (typeId) =>
      selectedTypeIds.has(typeId) &&
      !Object.values(editorState.countries).some(
        (country) => country[countryTypeIdKey] === typeId,
      ),
  )

  if (deletableTypeIds.length === allTypeIds.length) {
    const protectedTypeId = types[preferredTypeId]
      ? preferredTypeId
      : allTypeIds[0]
    deletableTypeIds = deletableTypeIds.filter(
      (typeId) => typeId !== protectedTypeId,
    )
  }

  if (deletableTypeIds.length === 0) {
    return { deletableTypeIds, editorState }
  }

  const nextTypes = { ...types }

  for (const typeId of deletableTypeIds) {
    delete nextTypes[typeId]
  }

  return {
    deletableTypeIds,
    editorState: { ...editorState, [typesKey]: nextTypes },
  }
}

export function addAutonomyType(editorState) {
  const { typeId, type } = createCustomNumericType(
    editorState.autonomyTypes,
    '새 자치도 유형',
    'autonomy',
    5,
  )

  return commandSucceeded({
    ...editorState,
    autonomyTypes: { ...editorState.autonomyTypes, [typeId]: type },
  })
}

export function updateAutonomyType(editorState, typeId, typeChanges) {
  const currentType = editorState.autonomyTypes[typeId]

  if (!currentType) {
    return commandFailed(editorState, '')
  }

  const autonomy = normalizeScale(typeChanges.autonomy)
  const countriesUsingType = Object.entries(editorState.countries).filter(
    ([, country]) => country.autonomyTypeId === typeId,
  )

  if (
    autonomy < 10 &&
    countriesUsingType.some(([, country]) => !country.overlordId)
  ) {
    return commandFailed(
      editorState,
      '이 유형을 사용하는 국가에 먼저 종주국을 지정해야 합니다.',
    )
  }

  if (
    autonomy < 10 &&
    countriesUsingType.some(([countryId]) =>
      Object.values(editorState.powerBlocs).some(
        (bloc) => bloc.leaderCountryId === countryId,
      ),
    )
  ) {
    return commandFailed(
      editorState,
      '세력 블록 대표국이 사용하는 자치도 유형은 10이어야 합니다.',
    )
  }

  const normalizedType = {
    name: typeChanges.name,
    englishName: typeChanges.englishName,
    autonomy,
  }

  if (
    currentType.name === normalizedType.name &&
    currentType.englishName === normalizedType.englishName &&
    currentType.autonomy === normalizedType.autonomy
  ) {
    return commandSucceeded(editorState)
  }

  let nextCountries = editorState.countries

  if (autonomy === 10 && countriesUsingType.length > 0) {
    nextCountries = { ...editorState.countries }

    for (const [countryId, country] of countriesUsingType) {
      nextCountries[countryId] = { ...country, overlordId: null }
    }
  }

  return commandSucceeded({
    ...editorState,
    autonomyTypes: {
      ...editorState.autonomyTypes,
      [typeId]: normalizedType,
    },
    countries: nextCountries,
  })
}

export function deleteAutonomyTypes(editorState, typeIds) {
  const result = deleteUnusedTypes({
    editorState,
    requestedTypeIds: typeIds,
    typesKey: 'autonomyTypes',
    countryTypeIdKey: 'autonomyTypeId',
    preferredTypeId: DEFAULT_AUTONOMY_TYPE_ID,
  })

  if (result.deletableTypeIds.length === 0) {
    return commandFailed(
      editorState,
      '사용 중이거나 마지막 남은 자치도 유형은 삭제할 수 없습니다.',
    )
  }

  return {
    deletedIds: result.deletableTypeIds,
    editorState: result.editorState,
    ok: true,
  }
}

export function addPowerRankType(editorState) {
  const { typeId, type } = createCustomNumericType(
    editorState.powerRankTypes,
    '새 국가 등급',
    'level',
    5,
  )

  return commandSucceeded({
    ...editorState,
    powerRankTypes: { ...editorState.powerRankTypes, [typeId]: type },
  })
}

export function updatePowerRankType(editorState, typeId, typeChanges) {
  const currentType = editorState.powerRankTypes[typeId]

  if (!currentType) {
    return commandFailed(editorState, '')
  }

  const level = normalizeScale(typeChanges.level)
  const countriesUsingType = Object.entries(editorState.countries).filter(
    ([, country]) => country.powerRankTypeId === typeId,
  )

  if (
    level < 7 &&
    countriesUsingType.some(([countryId]) =>
      Object.values(editorState.powerBlocs).some(
        (bloc) => bloc.leaderCountryId === countryId,
      ),
    )
  ) {
    return commandFailed(
      editorState,
      '세력 블록 대표국이 사용하는 국가 등급은 7 이상이어야 합니다.',
    )
  }

  const normalizedType = {
    name: typeChanges.name,
    englishName: typeChanges.englishName,
    level,
  }

  if (
    currentType.name === normalizedType.name &&
    currentType.englishName === normalizedType.englishName &&
    currentType.level === normalizedType.level
  ) {
    return commandSucceeded(editorState)
  }

  return commandSucceeded({
    ...editorState,
    powerRankTypes: {
      ...editorState.powerRankTypes,
      [typeId]: normalizedType,
    },
  })
}

export function deletePowerRankTypes(editorState, typeIds) {
  const result = deleteUnusedTypes({
    editorState,
    requestedTypeIds: typeIds,
    typesKey: 'powerRankTypes',
    countryTypeIdKey: 'powerRankTypeId',
    preferredTypeId: DEFAULT_POWER_RANK_TYPE_ID,
  })

  if (result.deletableTypeIds.length === 0) {
    return commandFailed(
      editorState,
      '사용 중이거나 마지막 남은 국가 등급은 삭제할 수 없습니다.',
    )
  }

  return {
    deletedIds: result.deletableTypeIds,
    editorState: result.editorState,
    ok: true,
  }
}
