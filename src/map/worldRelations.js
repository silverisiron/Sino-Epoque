export function getTopIndependentCountryId(countryId, countries, autonomyTypes) {
  const visited = new Set()
  let currentCountryId = countryId

  while (currentCountryId && !visited.has(currentCountryId)) {
    visited.add(currentCountryId)
    const country = countries[currentCountryId]

    if (!country) {
      return null
    }

    if (autonomyTypes[country.autonomyTypeId]?.autonomy === 10) {
      return currentCountryId
    }

    currentCountryId = country.overlordId
  }

  return null
}

export function getAutomaticBlocMemberIds(leaderCountryId, countries, autonomyTypes) {
  const memberIds = new Set()

  for (const countryId of Object.keys(countries)) {
    if (
      countryId !== leaderCountryId &&
      getTopIndependentCountryId(countryId, countries, autonomyTypes) === leaderCountryId
    ) {
      memberIds.add(countryId)
    }
  }

  return memberIds
}

export function getBlocMemberIds(bloc, countries, autonomyTypes) {
  const memberIds = getAutomaticBlocMemberIds(bloc.leaderCountryId, countries, autonomyTypes)

  for (const countryId of bloc.memberCountryIds) {
    if (countries[countryId] && countryId !== bloc.leaderCountryId) {
      memberIds.add(countryId)
    }
  }

  return memberIds
}

export function createCountryBlocIndex(powerBlocs, countries, autonomyTypes) {
  const blocIdByCountry = new Map()

  for (const [blocId, bloc] of Object.entries(powerBlocs)) {
    if (!blocIdByCountry.has(bloc.leaderCountryId)) {
      blocIdByCountry.set(bloc.leaderCountryId, blocId)
    }

    for (const countryId of getBlocMemberIds(bloc, countries, autonomyTypes)) {
      if (!blocIdByCountry.has(countryId)) {
        blocIdByCountry.set(countryId, blocId)
      }
    }
  }

  return blocIdByCountry
}

export function hasBlocMembershipConflict(powerBlocs, countries, autonomyTypes) {
  const seenCountryIds = new Set()

  for (const bloc of Object.values(powerBlocs)) {
    const countryIds = new Set([
      bloc.leaderCountryId,
      ...getBlocMemberIds(bloc, countries, autonomyTypes),
    ])

    for (const countryId of countryIds) {
      if (seenCountryIds.has(countryId)) {
        return true
      }

      seenCountryIds.add(countryId)
    }
  }

  return false
}
