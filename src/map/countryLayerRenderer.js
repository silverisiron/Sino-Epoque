import { hexToRgb } from './color'
import {
  createCountryBlocIndex,
  getTopIndependentCountryId,
} from './worldRelations'

function blendHexWithWhite(color, opacity) {
  const rgb = hexToRgb(color)
  const ratio = opacity / 100

  return {
    red: Math.round(255 + (rgb.red - 255) * ratio),
    green: Math.round(255 + (rgb.green - 255) * ratio),
    blue: Math.round(255 + (rgb.blue - 255) * ratio),
  }
}

export function getCountryLayerAppearance(
  countryId,
  countries,
  autonomyTypes,
  powerRankTypes,
  powerBlocs,
  settings,
  providedBlocIndex,
) {
  const country = countries[countryId]

  if (!country) {
    return null
  }

  const mode = settings.mode
  const selectedIds = settings.selectedIdsByMode[mode]
  const opacityById = settings.opacityByIdByMode[mode]
  let itemId
  let sourceCountry
  let defaultOpacity = 90

  if (mode === 'powerRank') {
    itemId = country.powerRankTypeId
    sourceCountry = country
    defaultOpacity = (powerRankTypes[itemId]?.level ?? 1) * 10
  } else if (mode === 'powerBloc') {
    const blocIndex =
      providedBlocIndex ??
      createCountryBlocIndex(powerBlocs, countries, autonomyTypes)
    itemId = blocIndex.get(countryId)
    sourceCountry = itemId
      ? countries[powerBlocs[itemId]?.leaderCountryId]
      : null
  } else {
    const autonomyType = autonomyTypes[country.autonomyTypeId]

    if (!autonomyType || autonomyType.autonomy === 10) {
      return null
    }

    itemId = country.autonomyTypeId
    const topCountryId = getTopIndependentCountryId(
      countryId,
      countries,
      autonomyTypes,
    )
    sourceCountry = topCountryId ? countries[topCountryId] : null
  }

  if (!itemId || !sourceCountry || !selectedIds.includes(itemId)) {
    return null
  }

  const opacity = Math.min(
    100,
    Math.max(0, Number(opacityById[itemId] ?? defaultOpacity)),
  )

  return { color: blendHexWithWhite(sourceCountry.color, opacity), opacity: 1 }
}

export function drawCountryLayer(
  countryLayerCanvas,
  countryLayerImageData,
  pixelCache,
  provinceAssignments,
  countries,
  autonomyTypes,
  powerRankTypes,
  powerBlocs,
  settings,
) {
  if (!countryLayerCanvas || !countryLayerImageData) {
    return
  }

  const context = countryLayerCanvas.getContext('2d')
  const output = countryLayerImageData.data
  const appearanceByCountry = new Map()
  const blocIndex =
    settings.mode === 'powerBloc'
      ? createCountryBlocIndex(powerBlocs, countries, autonomyTypes)
      : null
  output.fill(0)

  const selectedIds = settings.selectedIdsByMode[settings.mode]

  if (selectedIds.length === 0) {
    context.clearRect(
      0,
      0,
      countryLayerCanvas.width,
      countryLayerCanvas.height,
    )
    return
  }

  for (const [provinceId, countryId] of Object.entries(provinceAssignments)) {
    if (!appearanceByCountry.has(countryId)) {
      const appearance = getCountryLayerAppearance(
        countryId,
        countries,
        autonomyTypes,
        powerRankTypes,
        powerBlocs,
        settings,
        blocIndex,
      )
      appearanceByCountry.set(
        countryId,
        appearance ? { color: appearance.color, alpha: 255 } : null,
      )
    }

    const appearance = appearanceByCountry.get(countryId)
    const cacheEntry = pixelCache.get(provinceId)

    if (!appearance || !cacheEntry) {
      continue
    }

    for (const pixelIndex of cacheEntry.pixels) {
      output[pixelIndex] = appearance.color.red
      output[pixelIndex + 1] = appearance.color.green
      output[pixelIndex + 2] = appearance.color.blue
      output[pixelIndex + 3] = appearance.alpha
    }
  }

  context.putImageData(countryLayerImageData, 0, 0)
}
