export const DEFAULT_AUTONOMY_TYPE_ID = 'independent'
export const DEFAULT_POWER_RANK_TYPE_ID = 'decentralized'

export const DEFAULT_AUTONOMY_TYPES = Object.freeze({
  independent: {
    name: '독립국',
    englishName: 'Independent',
    autonomy: 10,
    builtIn: true,
  },
  personal_union: {
    name: '동군연합',
    englishName: 'Personal Union',
    autonomy: 9,
    builtIn: true,
  },
  dominion: {
    name: '자치령',
    englishName: 'Dominion',
    autonomy: 8,
    builtIn: true,
  },
  protectorate: {
    name: '피보호국',
    englishName: 'Protectorate',
    autonomy: 7,
    builtIn: true,
  },
  chartered_company: {
    name: '특허 회사',
    englishName: 'Chartered Company',
    autonomy: 6,
    builtIn: true,
  },
  puppet: {
    name: '괴뢰국',
    englishName: 'Puppet',
    autonomy: 5,
    builtIn: true,
  },
  colony: {
    name: '식민지',
    englishName: 'Colony',
    autonomy: 4,
    builtIn: true,
  },
  crown_colony: {
    name: '직할 식민지',
    englishName: 'Crown Colony',
    autonomy: 3,
    builtIn: true,
  },
  occupied: {
    name: '점령지',
    englishName: 'Occupied',
    autonomy: 2,
    builtIn: true,
  },
  integrated: {
    name: '본토화',
    englishName: 'Integrated',
    autonomy: 1,
    builtIn: true,
  },
})

export const DEFAULT_POWER_RANK_TYPES = Object.freeze({
  great_power: {
    name: '세계 열강',
    englishName: 'Great Power',
    level: 10,
    builtIn: true,
  },
  major_power: {
    name: '강대국',
    englishName: 'Major Power',
    level: 8,
    builtIn: true,
  },
  regional_power: {
    name: '지역강국',
    englishName: 'Regional Power',
    level: 6,
    builtIn: true,
  },
  minor_power: {
    name: '개발도상국',
    englishName: 'Minor Power',
    level: 4,
    builtIn: true,
  },
  decentralized: {
    name: '분권형 국가',
    englishName: 'Decentralized',
    level: 1,
    builtIn: true,
  },
})

export function createDefaultAutonomyTypes() {
  return Object.fromEntries(
    Object.entries(DEFAULT_AUTONOMY_TYPES).map(([id, type]) => [id, { ...type }]),
  )
}

export function createDefaultPowerRankTypes() {
  return Object.fromEntries(
    Object.entries(DEFAULT_POWER_RANK_TYPES).map(([id, type]) => [id, { ...type }]),
  )
}

function normalizeScaleValue(value, fallback) {
  const number = Number.parseInt(value, 10)
  return Math.min(10, Math.max(1, Number.isNaN(number) ? fallback : number))
}

function normalizeAutonomyTypes(rawTypes = {}) {
  const autonomyTypes = createDefaultAutonomyTypes()

  for (const [id, type] of Object.entries(rawTypes)) {
    if (!id || !type) {
      continue
    }

    autonomyTypes[id] = {
      name: type.name?.trim() || id,
      englishName: type.englishName?.trim() || '',
      autonomy: normalizeScaleValue(type.autonomy, 10),
      builtIn: Boolean(DEFAULT_AUTONOMY_TYPES[id] || type.builtIn),
    }
  }

  return autonomyTypes
}

function normalizePowerRankTypes(rawTypes = {}) {
  const powerRankTypes = createDefaultPowerRankTypes()

  for (const [id, type] of Object.entries(rawTypes)) {
    if (!id || !type) {
      continue
    }

    powerRankTypes[id] = {
      name: type.name?.trim() || id,
      englishName: type.englishName?.trim() || '',
      level: normalizeScaleValue(type.level, 1),
      builtIn: Boolean(DEFAULT_POWER_RANK_TYPES[id] || type.builtIn),
    }
  }

  return powerRankTypes
}

function normalizeVersionOnePreset(preset) {
  const countries = {}
  const countryOrder = []
  const countryIdByColor = new Map()

  Object.entries(preset.countries ?? {}).forEach(([color, country], index) => {
    const countryId = `country_${index + 1}`
    countryIdByColor.set(color, countryId)
    countryOrder.push(countryId)
    countries[countryId] = {
      ...country,
      color,
      autonomyTypeId: DEFAULT_AUTONOMY_TYPE_ID,
      powerRankTypeId: DEFAULT_POWER_RANK_TYPE_ID,
      overlordId: null,
    }
  })

  const provinceAssignments = {}

  for (const [provinceId, color] of Object.entries(preset.provinceAssignments ?? {})) {
    const countryId = countryIdByColor.get(color)

    if (countryId) {
      provinceAssignments[provinceId] = countryId
    }
  }

  return {
    version: 3,
    baseMap: preset.baseMap ?? 'base',
    autonomyTypes: createDefaultAutonomyTypes(),
    powerRankTypes: createDefaultPowerRankTypes(),
    powerBlocs: {},
    countries,
    countryOrder,
    provinceAssignments,
  }
}

export function normalizePreset(preset = {}) {
  if (preset.version !== 2 && preset.version !== 3) {
    preset = normalizeVersionOnePreset(preset)
  }

  const autonomyTypes = normalizeAutonomyTypes(preset.autonomyTypes)
  const powerRankTypes = normalizePowerRankTypes(preset.powerRankTypes)
  const countries = {}

  for (const [countryId, country] of Object.entries(preset.countries ?? {})) {
    const autonomyTypeId = autonomyTypes[country.autonomyTypeId]
      ? country.autonomyTypeId
      : DEFAULT_AUTONOMY_TYPE_ID
    const autonomyType = autonomyTypes[autonomyTypeId]
    const powerRankTypeId = powerRankTypes[country.powerRankTypeId]
      ? country.powerRankTypeId
      : DEFAULT_POWER_RANK_TYPE_ID

    countries[countryId] = {
      ...country,
      name: country.name?.trim() || countryId,
      color: country.color || '#808080',
      autonomyTypeId,
      powerRankTypeId,
      overlordId: autonomyType.autonomy < 10 ? country.overlordId ?? null : null,
    }
  }

  const knownCountryIds = new Set(Object.keys(countries))
  const countryOrder = [
    ...(preset.countryOrder ?? []).filter((countryId) => knownCountryIds.has(countryId)),
  ]
  const orderedCountryIds = new Set(countryOrder)

  for (const countryId of knownCountryIds) {
    if (!orderedCountryIds.has(countryId)) {
      countryOrder.push(countryId)
    }
  }

  const powerBlocs = {}

  for (const [blocId, bloc] of Object.entries(preset.powerBlocs ?? {})) {
    if (!blocId || !bloc || !knownCountryIds.has(bloc.leaderCountryId)) {
      continue
    }

    powerBlocs[blocId] = {
      name: bloc.name?.trim() || blocId,
      leaderCountryId: bloc.leaderCountryId,
      memberCountryIds: [...new Set(bloc.memberCountryIds ?? [])].filter(
        (countryId) => countryId !== bloc.leaderCountryId && knownCountryIds.has(countryId),
      ),
    }
  }

  return {
    version: 3,
    baseMap: preset.baseMap ?? 'base',
    autonomyTypes,
    powerRankTypes,
    powerBlocs,
    countries,
    countryOrder,
    provinceAssignments: { ...(preset.provinceAssignments ?? {}) },
  }
}
