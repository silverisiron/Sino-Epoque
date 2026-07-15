import { getStateIdForProvince, hexToRgb, isWater } from './mapData'

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

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const rgb = `${data[index]},${data[index + 1]},${data[index + 2]}`
      const province = provinceByRgb.get(rgb)
      const rightIndex = x < width - 1 ? index + 4 : index
      const bottomIndex = y < height - 1 ? index + width * 4 : index
      const rightRgb = `${data[rightIndex]},${data[rightIndex + 1]},${data[rightIndex + 2]}`
      const bottomRgb = `${data[bottomIndex]},${data[bottomIndex + 1]},${data[bottomIndex + 2]}`
      const rightProvince = provinceByRgb.get(rightRgb)
      const bottomProvince = provinceByRgb.get(bottomRgb)
      const isProvinceBorder = rgb !== rightRgb || rgb !== bottomRgb
      const isStateBorder =
        getStateIdForProvince(province, stateByProvince) !==
          getStateIdForProvince(rightProvince, stateByProvince) ||
        getStateIdForProvince(province, stateByProvince) !==
          getStateIdForProvince(bottomProvince, stateByProvince)
      const isBorder = borderMode === 'state' ? isStateBorder : isProvinceBorder

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

export function drawBorderMap(borderCanvas, sourceImageData, provinceByRgb, stateByProvince, borderMode) {
  if (!borderCanvas || !sourceImageData) {
    return
  }

  const context = borderCanvas.getContext('2d', { willReadFrequently: true })
  context.putImageData(
    createBorderImageData(sourceImageData, provinceByRgb, stateByProvince, borderMode),
    0,
    0,
  )
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

export function drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, color) {
  if (!overlayCanvas || !overlayImageData || !province || isWater(province)) {
    return
  }

  const context = overlayCanvas.getContext('2d')
  const cacheEntry = pixelCache.get(province.id)

  if (!cacheEntry) {
    return
  }

  const output = overlayImageData.data
  const parsedColor = color ? hexToRgb(color) : null

  for (const pixelIndex of cacheEntry.pixels) {
    output[pixelIndex] = parsedColor?.red ?? 0
    output[pixelIndex + 1] = parsedColor?.green ?? 0
    output[pixelIndex + 2] = parsedColor?.blue ?? 0
    output[pixelIndex + 3] = parsedColor ? 255 : 0
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

export function drawProvincesOverlay(overlayCanvas, overlayImageData, pixelCache, provinces, color) {
  for (const province of provinces) {
    drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, color)
  }
}

export function drawAllOverlay(overlayCanvas, overlayImageData, pixelCache, provinceById, assignments, countries) {
  if (!overlayCanvas || !overlayImageData) {
    return
  }

  const context = overlayCanvas.getContext('2d')

  overlayImageData.data.fill(0)
  context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

  for (const [provinceId, color] of Object.entries(assignments)) {
    if (!countries[color]) {
      continue
    }

    const province = provinceById.get(provinceId)
    drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, color)
  }
}
