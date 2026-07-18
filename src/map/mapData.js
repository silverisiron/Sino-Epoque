export function parseDefinitionCsv(csvText) {
  const provinceByRgb = new Map()
  const provinceById = new Map()

  for (const line of csvText.trim().split(/\r?\n/)) {
    const [id, red, green, blue, type, coastal, terrain, continent] = line.split(';')

    if (!id || red === undefined || green === undefined || blue === undefined) {
      continue
    }

    const province = {
      id,
      rgb: `${red},${green},${blue}`,
      red: Number(red),
      green: Number(green),
      blue: Number(blue),
      type,
      coastal,
      terrain,
      continent,
    }

    provinceByRgb.set(province.rgb, province)
    provinceById.set(province.id, province)
  }

  return { provinceByRgb, provinceById }
}

export function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  }
}

export function isWater(province) {
  return province?.type === 'sea' || province?.type === 'lake'
}

export function getStateIdForProvince(province, stateByProvince) {
  return province ? stateByProvince.get(province.id) : null
}

export function downloadJson(fileName, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

export function clampZoom(value, minimum = 0.15) {
  return Math.min(Math.max(2, minimum), Math.max(minimum, value))
}

export function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}
