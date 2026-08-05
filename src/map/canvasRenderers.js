import { hexToRgb } from './color'
import { isWater } from './provinceData'

function getRgbKey(data, index) {
  return (data[index] << 16) | (data[index + 1] << 8) | data[index + 2]
}

export function createWaterMaskImageData(sourceImageData, provinceByRgb) {
  const { width, height, data } = sourceImageData
  const maskImageData = new ImageData(width, height)
  const output = maskImageData.data

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const rgb = `${data[index]},${data[index + 1]},${data[index + 2]}`
      const province = provinceByRgb.get(rgb)

      if (isWater(province)) {
        output[index] = 255
        output[index + 1] = 255
        output[index + 2] = 255
        output[index + 3] = 255
      }
    }
  }

  return maskImageData
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

export function fillCanvasColor(canvas, color) {
  if (!canvas?.width) {
    return
  }

  const context = canvas.getContext('2d')
  context.globalCompositeOperation = 'source-over'
  context.fillStyle = color
  context.fillRect(0, 0, canvas.width, canvas.height)
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

function paintProvincePixels(
  overlayImageData,
  pixelCache,
  province,
  parsedColor,
  opacity,
) {
  if (!province || isWater(province)) {
    return null
  }

  const cacheEntry = pixelCache.get(province.id)

  if (!cacheEntry) {
    return null
  }

  const output = overlayImageData.data

  for (const pixelIndex of cacheEntry.pixels) {
    output[pixelIndex] = parsedColor?.red ?? 0
    output[pixelIndex + 1] = parsedColor?.green ?? 0
    output[pixelIndex + 2] = parsedColor?.blue ?? 0
    output[pixelIndex + 3] = parsedColor ? Math.round(255 * opacity) : 0
  }

  return {
    x: cacheEntry.minX,
    y: cacheEntry.minY,
    width: cacheEntry.maxX - cacheEntry.minX + 1,
    height: cacheEntry.maxY - cacheEntry.minY + 1,
  }
}

function mergeDirtyRegions(currentRegion, nextRegion) {
  if (!currentRegion) {
    return nextRegion
  }

  if (!nextRegion) {
    return currentRegion
  }

  const minX = Math.min(currentRegion.x, nextRegion.x)
  const minY = Math.min(currentRegion.y, nextRegion.y)
  const maxX = Math.max(
    currentRegion.x + currentRegion.width,
    nextRegion.x + nextRegion.width,
  )
  const maxY = Math.max(
    currentRegion.y + currentRegion.height,
    nextRegion.y + nextRegion.height,
  )

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

function commitOverlayRegion(canvas, imageData, dirtyRegion) {
  if (!dirtyRegion) {
    return
  }

  const context = canvas.getContext('2d')
  context.putImageData(
    imageData,
    0,
    0,
    dirtyRegion.x,
    dirtyRegion.y,
    dirtyRegion.width,
    dirtyRegion.height,
  )
}

export function drawProvinceOverlay(
  overlayCanvas,
  overlayImageData,
  pixelCache,
  province,
  color,
  opacity = 1,
) {
  if (!overlayCanvas || !overlayImageData) {
    return null
  }

  const parsedColor = color
    ? typeof color === 'string'
      ? hexToRgb(color)
      : color
    : null
  const dirtyRegion = paintProvincePixels(
    overlayImageData,
    pixelCache,
    province,
    parsedColor,
    opacity,
  )

  commitOverlayRegion(overlayCanvas, overlayImageData, dirtyRegion)
  return dirtyRegion
}

export function drawProvincesOverlay(
  overlayCanvas,
  overlayImageData,
  pixelCache,
  provinces,
  color,
  opacity = 1,
) {
  if (!overlayCanvas || !overlayImageData) {
    return null
  }

  const parsedColor = color
    ? typeof color === 'string'
      ? hexToRgb(color)
      : color
    : null
  let dirtyRegion = null

  for (const province of provinces) {
    dirtyRegion = mergeDirtyRegions(
      dirtyRegion,
      paintProvincePixels(
        overlayImageData,
        pixelCache,
        province,
        parsedColor,
        opacity,
      ),
    )
  }

  commitOverlayRegion(overlayCanvas, overlayImageData, dirtyRegion)
  return dirtyRegion
}

export function drawProvinceAssignments(
  overlayCanvas,
  overlayImageData,
  pixelCache,
  provinceById,
  provinceAssignments,
  countries,
) {
  if (!overlayCanvas || !overlayImageData) {
    return
  }

  const context = overlayCanvas.getContext('2d')

  overlayImageData.data.fill(0)
  context.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)

  for (const [provinceId, countryId] of Object.entries(provinceAssignments)) {
    const country = countries[countryId]

    if (!country) {
      continue
    }

    const province = provinceById.get(provinceId)
    paintProvincePixels(
      overlayImageData,
      pixelCache,
      province,
      hexToRgb(country.color),
      1,
    )
  }

  context.putImageData(overlayImageData, 0, 0)
}
