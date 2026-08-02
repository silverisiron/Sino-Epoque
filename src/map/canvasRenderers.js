import { hexToRgb, isWater } from './mapData'
import { createCountryBlocIndex, getTopIndependentCountryId } from './worldRelations'

function getRgbKey(data, index) {
  return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2]
}

export function createBlankMapImageData(sourceImageData, provinceByRgb) {
  const { width, height, data } = sourceImageData
  const blankImageData = new ImageData(width, height)
  const output = blankImageData.data

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const rgb = `${data[index]},${data[index + 1]},${data[index + 2]}`
      const province = provinceByRgb.get(rgb)

      if (isWater(province)) {
        output[index] = 218
        output[index + 1] = 233
        output[index + 2] = 247
      } else {
        output[index] = 248
        output[index + 1] = 250
        output[index + 2] = 252
      }

      output[index + 3] = 255
    }
  }

  return blankImageData
}

export function createBorderImageData(sourceImageData, provinceByRgb, stateByProvince, borderMode) {
  const { width, height, data } = sourceImageData
  const borderImageData = new ImageData(width, height)
  const output = borderImageData.data

  if (borderMode === 'none') {
    return borderImageData
  }

  let stateIdByPixel = null

  if (borderMode === 'state') {
    const stateIdByRgb = new Map()

    for (const province of provinceByRgb.values()) {
      const stateId = Number(stateByProvince.get(province.id)) || 0
      const rgbKey = (province.red << 16) | (province.green << 8) | province.blue
      stateIdByRgb.set(rgbKey, stateId)
    }

    stateIdByPixel = new Uint32Array(width * height)

    for (let pixel = 0, index = 0; pixel < stateIdByPixel.length; pixel += 1, index += 4) {
      stateIdByPixel[pixel] = stateIdByRgb.get(getRgbKey(data, index)) ?? 0
    }
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixel = y * width + x
      const index = pixel * 4
      const rightPixel = x < width - 1 ? pixel + 1 : pixel
      const bottomPixel = y < height - 1 ? pixel + width : pixel
      let isBorder

      if (stateIdByPixel) {
        isBorder =
          stateIdByPixel[pixel] !== stateIdByPixel[rightPixel] ||
          stateIdByPixel[pixel] !== stateIdByPixel[bottomPixel]
      } else {
        const rightIndex = rightPixel * 4
        const bottomIndex = bottomPixel * 4
        isBorder =
          data[index] !== data[rightIndex] ||
          data[index + 1] !== data[rightIndex + 1] ||
          data[index + 2] !== data[rightIndex + 2] ||
          data[index] !== data[bottomIndex] ||
          data[index + 1] !== data[bottomIndex + 1] ||
          data[index + 2] !== data[bottomIndex + 2]
      }

      if (isBorder) {
        output[index] = 20
        output[index + 1] = 20
        output[index + 2] = 20
        output[index + 3] = 255
      }
    }
  }

  return borderImageData
}

export function drawBlankMap(baseCanvas, sourceImageData, provinceByRgb) {
  if (!baseCanvas || !sourceImageData) {
    return
  }

  const context = baseCanvas.getContext('2d', { willReadFrequently: true })
  context.putImageData(createBlankMapImageData(sourceImageData, provinceByRgb), 0, 0)
}

export function buildProvincePixelCache(sourceImageData, provinceByRgb) {
  const cache = new Map()
  const { width, height, data } = sourceImageData

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const pixelIndex = (y * width + x) * 4
      const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`
      const province = provinceByRgb.get(rgb)

      if (!province) {
        continue
      }

      let entry = cache.get(province.id)

      if (!entry) {
        entry = {
          pixels: [],
          minX: x,
          minY: y,
          maxX: x,
          maxY: y,
        }
        cache.set(province.id, entry)
      }

      entry.pixels.push(pixelIndex)
      entry.minX = Math.min(entry.minX, x)
      entry.minY = Math.min(entry.minY, y)
      entry.maxX = Math.max(entry.maxX, x)
      entry.maxY = Math.max(entry.maxY, y)
    }
  }

  for (const [provinceId, entry] of cache) {
    cache.set(provinceId, {
      ...entry,
      pixels: Uint32Array.from(entry.pixels),
    })
  }

  return cache
}

export function drawProvinceOverlay(
  overlayCanvas,
  overlayImageData,
  pixelCache,
  province,
  color,
  opacity = 1,
) {
  if (!overlayCanvas || !overlayImageData || !province || isWater(province)) {
    return
  }

  const context = overlayCanvas.getContext('2d')
  const cacheEntry = pixelCache.get(province.id)

  if (!cacheEntry) {
    return
  }

  const output = overlayImageData.data
  const parsedColor = color ? (typeof color === 'string' ? hexToRgb(color) : color) : null

  for (const pixelIndex of cacheEntry.pixels) {
    output[pixelIndex] = parsedColor?.red ?? 0
    output[pixelIndex + 1] = parsedColor?.green ?? 0
    output[pixelIndex + 2] = parsedColor?.blue ?? 0
    output[pixelIndex + 3] = parsedColor ? Math.round(255 * opacity) : 0
  }

  context.putImageData(
    overlayImageData,
    0,
    0,
    cacheEntry.minX,
    cacheEntry.minY,
    cacheEntry.maxX - cacheEntry.minX + 1,
    cacheEntry.maxY - cacheEntry.minY + 1,
  )
}

export function drawProvincesOverlay(
  overlayCanvas,
  overlayImageData,
  pixelCache,
  provinces,
  color,
  opacity = 1,
) {
  for (const province of provinces) {
    drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, color, opacity)
  }
}

function blendHexWithWhite(color, opacity) {
  const rgb = hexToRgb(color)
  const ratio = opacity / 100

  return {
    red: Math.round(255 + (rgb.red - 255) * ratio),
    green: Math.round(255 + (rgb.green - 255) * ratio),
    blue: Math.round(255 + (rgb.blue - 255) * ratio),
  }
}

export function getSphereLayerAppearance(
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

  const mode = settings.mode ?? 'autonomy'
  const selectedIds = settings.selectedIdsByMode?.[mode] ?? settings.selectedTypeIds ?? []
  const opacityById = settings.opacityByIdByMode?.[mode] ?? settings.opacityByType ?? {}
  let itemId
  let sourceCountry
  let defaultOpacity = 90

  if (mode === 'powerRank') {
    itemId = country.powerRankTypeId
    sourceCountry = country
    defaultOpacity = (powerRankTypes[itemId]?.level ?? 1) * 10
  } else if (mode === 'powerBloc') {
    const blocIndex =
      providedBlocIndex ?? createCountryBlocIndex(powerBlocs, countries, autonomyTypes)
    itemId = blocIndex.get(countryId)
    sourceCountry = itemId ? countries[powerBlocs[itemId]?.leaderCountryId] : null
  } else {
    const autonomyType = autonomyTypes[country.autonomyTypeId]

    if (!autonomyType || autonomyType.autonomy === 10) {
      return null
    }

    itemId = country.autonomyTypeId
    const topCountryId = getTopIndependentCountryId(countryId, countries, autonomyTypes)
    sourceCountry = topCountryId ? countries[topCountryId] : null
  }

  if (!itemId || !sourceCountry || !selectedIds.includes(itemId)) {
    return null
  }

  const opacity = Math.min(100, Math.max(0, Number(opacityById[itemId] ?? defaultOpacity)))

  return { color: blendHexWithWhite(sourceCountry.color, opacity), opacity: 1 }
}

export function drawSphereLayer(
  sphereCanvas,
  sphereImageData,
  pixelCache,
  assignments,
  countries,
  autonomyTypes,
  powerRankTypes,
  powerBlocs,
  settings,
) {
  if (!sphereCanvas || !sphereImageData) {
    return
  }

  const context = sphereCanvas.getContext('2d')
  const output = sphereImageData.data
  const appearanceByCountry = new Map()
  const blocIndex =
    settings.mode === 'powerBloc'
      ? createCountryBlocIndex(powerBlocs, countries, autonomyTypes)
      : null
  output.fill(0)

  const selectedIds =
    settings.selectedIdsByMode?.[settings.mode] ?? settings.selectedTypeIds ?? []

  if (selectedIds.length === 0) {
    context.clearRect(0, 0, sphereCanvas.width, sphereCanvas.height)
    return
  }

  for (const [provinceId, countryId] of Object.entries(assignments)) {
    if (!appearanceByCountry.has(countryId)) {
      const appearance = getSphereLayerAppearance(
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
        appearance
          ? {
              color: appearance.color,
              alpha: 255,
            }
          : null,
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

  context.putImageData(sphereImageData, 0, 0)
}

export function drawAllOverlay(overlayCanvas, overlayImageData, pixelCache, provinceById, assignments, countries) {
  if (!overlayCanvas || !overlayImageData) {
    return
  }

  const context = overlayCanvas.getContext('2d')

  overlayImageData.data.fill(0)
  context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

  for (const [provinceId, countryId] of Object.entries(assignments)) {
    const country = countries[countryId]

    if (!country) {
      continue
    }

    const province = provinceById.get(provinceId)
    drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, country.color)
  }
}
