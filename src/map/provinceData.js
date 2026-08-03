export function parseDefinitionCsv(csvText) {
  const provinceByRgb = new Map()
  const provinceById = new Map()

  for (const line of csvText.trim().split(/\r?\n/)) {
    const [id, red, green, blue, type, coastal, terrain, continent] =
      line.split(';')

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

export function isWater(province) {
  return province?.type === 'sea' || province?.type === 'lake'
}
