import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const BASE_MAP_PATH = '/maps/base'
const MAP_IMAGE_PATH = `${BASE_MAP_PATH}/bmp/provinces.bmp`
const DEFINITION_PATH = `${BASE_MAP_PATH}/csv/definition.csv`
const PRESET_INDEX_PATH = '/maps/presets/index.json'

function parseDefinitionCsv(csvText) {
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

function hexToRgb(hex) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)

  return {
    red: (value >> 16) & 255,
    green: (value >> 8) & 255,
    blue: value & 255,
  }
}

function isWater(province) {
  return province?.type === 'sea' || province?.type === 'lake'
}

function createBlankMapImageData(sourceImageData, provinceByRgb) {
  const { width, height, data } = sourceImageData
  const blankImageData = new ImageData(width, height)
  const output = blankImageData.data

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const rgb = `${data[index]},${data[index + 1]},${data[index + 2]}`
      const province = provinceByRgb.get(rgb)
      const rightIndex = x < width - 1 ? index + 4 : index
      const bottomIndex = y < height - 1 ? index + width * 4 : index
      const rightRgb = `${data[rightIndex]},${data[rightIndex + 1]},${data[rightIndex + 2]}`
      const bottomRgb = `${data[bottomIndex]},${data[bottomIndex + 1]},${data[bottomIndex + 2]}`
      const isBorder = rgb !== rightRgb || rgb !== bottomRgb

      if (isBorder) {
        output[index] = 20
        output[index + 1] = 20
        output[index + 2] = 20
      } else if (isWater(province)) {
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

function buildProvincePixelCache(sourceImageData, provinceByRgb) {
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

function drawProvinceOverlay(overlayCanvas, overlayImageData, pixelCache, province, color) {
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
    output[pixelIndex + 3] = parsedColor ? 170 : 0
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

function drawAllOverlay(overlayCanvas, overlayImageData, pixelCache, provinceById, assignments, countries) {
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

function downloadJson(fileName, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function clampZoom(value) {
  return Math.min(2, Math.max(0.15, value))
}

function App() {
  const mapScrollRef = useRef(null)
  const baseCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const sourceImageDataRef = useRef(null)
  const overlayImageDataRef = useRef(null)
  const provinceByRgbRef = useRef(new Map())
  const provinceByIdRef = useRef(new Map())
  const provincePixelCacheRef = useRef(new Map())
  const assignmentsRef = useRef({})
  const zoomRef = useRef(0.35)
  const isPaintingRef = useRef(false)
  const lastPaintedProvinceRef = useRef(null)
  const panRef = useRef(null)

  const [page, setPage] = useState('editor')
  const [status, setStatus] = useState('지도 데이터를 불러오는 중입니다.')
  const [mapSize, setMapSize] = useState(null)
  const [zoom, setZoom] = useState(0.35)
  const [activeTool, setActiveTool] = useState('paint')
  const [paintMode, setPaintMode] = useState('single')
  const [countries, setCountries] = useState({
    '#d94645': { name: '국가 1' },
  })
  const [activeColor, setActiveColor] = useState('#d94645')
  const [assignments, setAssignments] = useState({})
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [presetIndex, setPresetIndex] = useState([])
  const [selectedPresetPath, setSelectedPresetPath] = useState('')

  const activeCountry = countries[activeColor]
  const preset = useMemo(
    () => ({
      version: 1,
      baseMap: 'base',
      countries,
      provinceAssignments: assignments,
    }),
    [assignments, countries],
  )

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

  useEffect(() => {
    assignmentsRef.current = assignments
  }, [assignments])

  const updateZoom = useCallback(
    (nextZoom, anchor) => {
      const scrollContainer = mapScrollRef.current
      const currentZoom = zoomRef.current
      const clampedZoom = clampZoom(nextZoom)

      if (!scrollContainer || !mapSize || clampedZoom === currentZoom) {
        return
      }

      const rect = scrollContainer.getBoundingClientRect()
      const anchorX = anchor ? anchor.clientX - rect.left : rect.width / 2
      const anchorY = anchor ? anchor.clientY - rect.top : rect.height / 2
      const mapX = (scrollContainer.scrollLeft + anchorX) / currentZoom
      const mapY = (scrollContainer.scrollTop + anchorY) / currentZoom

      zoomRef.current = clampedZoom
      setZoom(clampedZoom)

      requestAnimationFrame(() => {
        scrollContainer.scrollLeft = mapX * clampedZoom - anchorX
        scrollContainer.scrollTop = mapY * clampedZoom - anchorY
      })
    },
    [mapSize],
  )

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function handleNativeWheel(event) {
      event.preventDefault()
      const direction = event.deltaY > 0 ? -1 : 1
      updateZoom(zoomRef.current + direction * 0.08, event)
    }

    scrollContainer.addEventListener('wheel', handleNativeWheel, { passive: false })

    return () => {
      scrollContainer.removeEventListener('wheel', handleNativeWheel)
    }
  }, [mapSize, updateZoom])

  useEffect(() => {
    let ignore = false

    async function loadMapData() {
      try {
        const [definitionResponse, presetIndexResponse] = await Promise.all([
          fetch(DEFINITION_PATH),
          fetch(PRESET_INDEX_PATH),
        ])

        if (!definitionResponse.ok) {
          throw new Error(`definition.csv 로드 실패: ${definitionResponse.status}`)
        }

        const definitionText = await definitionResponse.text()
        const { provinceByRgb, provinceById } = parseDefinitionCsv(definitionText)
        provinceByRgbRef.current = provinceByRgb
        provinceByIdRef.current = provinceById

        if (presetIndexResponse.ok) {
          const indexJson = await presetIndexResponse.json()
          setPresetIndex(indexJson)
          setSelectedPresetPath(indexJson[0]?.path ?? '')
        }

        const image = new Image()
        image.src = MAP_IMAGE_PATH
        await image.decode()

        if (ignore) {
          return
        }

        const baseCanvas = baseCanvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        const baseContext = baseCanvas.getContext('2d', { willReadFrequently: true })

        baseCanvas.width = image.naturalWidth
        baseCanvas.height = image.naturalHeight
        overlayCanvas.width = image.naturalWidth
        overlayCanvas.height = image.naturalHeight

        baseContext.drawImage(image, 0, 0)

        const sourceImageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
        sourceImageDataRef.current = sourceImageData
        overlayImageDataRef.current = new ImageData(baseCanvas.width, baseCanvas.height)
        provincePixelCacheRef.current = buildProvincePixelCache(sourceImageData, provinceByRgb)

        baseContext.putImageData(createBlankMapImageData(sourceImageData, provinceByRgb), 0, 0)

        setMapSize({ width: baseCanvas.width, height: baseCanvas.height })
        setStatus('지도 로드 완료')
      } catch (error) {
        if (!ignore) {
          setStatus(error.message)
        }
      }
    }

    loadMapData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    drawAllOverlay(
      overlayCanvasRef.current,
      overlayImageDataRef.current,
      provincePixelCacheRef.current,
      provinceByIdRef.current,
      assignmentsRef.current,
      countries,
    )
  }, [countries])

  function getProvinceFromPointer(event) {
    const sourceImageData = sourceImageDataRef.current
    const canvas = baseCanvasRef.current

    if (!sourceImageData || !canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height)
    const pixelIndex = (y * canvas.width + x) * 4
    const data = sourceImageData.data
    const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`
    const province = provinceByRgbRef.current.get(rgb)

    return { x, y, rgb, province }
  }

  function paintProvince(clicked) {
    if (!clicked?.province) {
      return
    }

    if (lastPaintedProvinceRef.current === clicked.province.id) {
      return
    }

    setSelectedProvince(clicked)
    lastPaintedProvinceRef.current = clicked.province.id

    if (page !== 'editor' || !activeCountry || activeTool !== 'paint' || isWater(clicked.province)) {
      return
    }

    assignmentsRef.current = {
      ...assignmentsRef.current,
      [clicked.province.id]: activeColor,
    }
    drawProvinceOverlay(
      overlayCanvasRef.current,
      overlayImageDataRef.current,
      provincePixelCacheRef.current,
      clicked.province,
      activeColor,
    )
    setAssignments(assignmentsRef.current)
  }

  function handlePointerDown(event) {
    const clicked = getProvinceFromPointer(event)

    if (activeTool === 'hand') {
      panRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        scrollLeft: mapScrollRef.current.scrollLeft,
        scrollTop: mapScrollRef.current.scrollTop,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (paintMode === 'multi') {
      isPaintingRef.current = true
      lastPaintedProvinceRef.current = null
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    paintProvince(clicked)
  }

  function handlePointerMove(event) {
    if (activeTool === 'hand' && panRef.current) {
      const scrollContainer = mapScrollRef.current
      scrollContainer.scrollLeft = panRef.current.scrollLeft - (event.clientX - panRef.current.startX)
      scrollContainer.scrollTop = panRef.current.scrollTop - (event.clientY - panRef.current.startY)
      return
    }

    if (activeTool === 'paint' && paintMode === 'multi' && isPaintingRef.current) {
      paintProvince(getProvinceFromPointer(event))
    }
  }

  function handlePointerUp(event) {
    if (panRef.current?.pointerId === event.pointerId) {
      panRef.current = null
    }

    isPaintingRef.current = false
    lastPaintedProvinceRef.current = null
  }

  function addCountry() {
    let color = '#4f46e5'
    let step = 0

    while (countries[color]) {
      step += 1
      color = `#${((0x4f46e5 + step * 0x12345) & 0xffffff).toString(16).padStart(6, '0')}`
    }

    setCountries((currentCountries) => ({
      ...currentCountries,
      [color]: { name: `국가 ${Object.keys(currentCountries).length + 1}` },
    }))
    setActiveColor(color)
  }

  function updateCountryName(color, name) {
    setCountries((currentCountries) => ({
      ...currentCountries,
      [color]: { name },
    }))
  }

  function updateCountryColor(previousColor, nextColor) {
    if (!nextColor || countries[nextColor]) {
      return
    }

    setCountries((currentCountries) => {
      const nextCountries = { ...currentCountries }
      nextCountries[nextColor] = nextCountries[previousColor]
      delete nextCountries[previousColor]
      return nextCountries
    })
    setAssignments((currentAssignments) => {
      const nextAssignments = {}

      for (const [provinceId, color] of Object.entries(currentAssignments)) {
        nextAssignments[provinceId] = color === previousColor ? nextColor : color
      }

      assignmentsRef.current = nextAssignments
      return nextAssignments
    })
    setActiveColor(nextColor)
  }

  function removeAssignment() {
    if (!selectedProvince?.province) {
      return
    }

    setAssignments((currentAssignments) => {
      const nextAssignments = { ...currentAssignments }
      delete nextAssignments[selectedProvince.province.id]
      assignmentsRef.current = nextAssignments
      drawProvinceOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        selectedProvince.province,
        null,
      )
      return nextAssignments
    })
  }

  async function loadPreset(path = selectedPresetPath) {
    if (!path) {
      return
    }

    const response = await fetch(path)

    if (!response.ok) {
      setStatus(`프리셋 로드 실패: ${response.status}`)
      return
    }

    const presetJson = await response.json()
    assignmentsRef.current = presetJson.provinceAssignments ?? {}
    setCountries(presetJson.countries ?? {})
    setAssignments(assignmentsRef.current)
    drawAllOverlay(
      overlayCanvasRef.current,
      overlayImageDataRef.current,
      provincePixelCacheRef.current,
      provinceByIdRef.current,
      assignmentsRef.current,
      presetJson.countries ?? {},
    )
    setActiveColor(Object.keys(presetJson.countries ?? {})[0] ?? '')
    setPage('loader')
    setStatus('프리셋 로드 완료')
  }

  const selectedCountryColor = selectedProvince?.province
    ? assignments[selectedProvince.province.id]
    : null
  const selectedCountry = selectedCountryColor ? countries[selectedCountryColor] : null
  const canvasStyle = mapSize
    ? { width: `${mapSize.width * zoom}px`, height: `${mapSize.height * zoom}px` }
    : undefined

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Province Map Tool</h1>
          <p>{status}</p>
        </div>
        <nav aria-label="페이지">
              <button type="button" aria-pressed={page === 'editor'} onClick={() => setPage('editor')}>
            Editor
          </button>
          <button type="button" aria-pressed={page === 'loader'} onClick={() => setPage('loader')}>
            Preset Loader
          </button>
        </nav>
      </header>

      <section className="map-panel" aria-labelledby="map-title">
        <div className="panel-header">
          <div>
            <h2 id="map-title">{page === 'editor' ? 'Map Editor' : 'Preset Loader'}</h2>
            <p>
              {mapSize ? `${mapSize.width} x ${mapSize.height}` : '-'} / zoom{' '}
              {Math.round(zoom * 100)}%
            </p>
          </div>
          <div className="map-tools" aria-label="지도 도구">
            <div className="tool-group" role="group" aria-label="도구">
              <button
                type="button"
                aria-pressed={activeTool === 'paint'}
                onClick={() => setActiveTool('paint')}
              >
                Paint
              </button>
              <button
                type="button"
                aria-pressed={activeTool === 'hand'}
                onClick={() => setActiveTool('hand')}
              >
                Hand
              </button>
            </div>
            <div className="zoom-buttons" role="group" aria-label="확대 축소">
              <button type="button" onClick={() => updateZoom(zoomRef.current + 0.15)}>
                +
              </button>
              <button type="button" onClick={() => updateZoom(zoomRef.current - 0.15)}>
                -
              </button>
            </div>
          </div>
        </div>

        <div className="map-scroll" ref={mapScrollRef}>
          <div className="canvas-stack" style={canvasStyle}>
            <canvas
              ref={baseCanvasRef}
              className="province-map"
              data-tool={activeTool}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              aria-label="프로빈스 백지도"
            />
            <canvas ref={overlayCanvasRef} className="province-overlay" aria-hidden="true" />
          </div>
        </div>
      </section>

      <aside className="side-panel" aria-label="맵 도구">
        {page === 'editor' ? (
          <section aria-labelledby="countries-title">
            <div className="side-header">
              <h2 id="countries-title">Countries</h2>
              <button type="button" onClick={addCountry}>
                Add
              </button>
            </div>

            <div className="paint-modes" role="group" aria-label="페인트 모드">
              <button
                type="button"
                aria-pressed={paintMode === 'single'}
                onClick={() => setPaintMode('single')}
              >
                Single
              </button>
              <button
                type="button"
                aria-pressed={paintMode === 'multi'}
                onClick={() => setPaintMode('multi')}
              >
                Multi
              </button>
            </div>

            <div className="country-list">
              {Object.entries(countries).map(([color, country]) => (
                <article
                  className="country-row"
                  data-active={activeColor === color}
                  key={color}
                >
                  <button
                    type="button"
                    className="swatch-button"
                    style={{ backgroundColor: color }}
                    aria-label={`${country.name} 선택`}
                    onClick={() => setActiveColor(color)}
                  />
                  <input
                    aria-label="국가 이름"
                    value={country.name}
                    onChange={(event) => updateCountryName(color, event.target.value)}
                  />
                  <input
                    aria-label="국가 색상"
                    type="color"
                    value={color}
                    onChange={(event) => updateCountryColor(color, event.target.value)}
                  />
                </article>
              ))}
            </div>

            <button
              type="button"
              className="full-button"
              onClick={() => downloadJson('map-preset.json', preset)}
            >
              Download Preset JSON
            </button>
          </section>
        ) : (
          <section aria-labelledby="presets-title">
            <h2 id="presets-title">Presets</h2>
            <label>
              Preset file
              <select
                value={selectedPresetPath}
                onChange={(event) => setSelectedPresetPath(event.target.value)}
              >
                {presetIndex.map((presetItem) => (
                  <option key={presetItem.path} value={presetItem.path}>
                    {presetItem.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="full-button" onClick={() => loadPreset()}>
              Load Preset
            </button>
          </section>
        )}

        <section className="province-info" aria-labelledby="province-title">
          <h2 id="province-title">Province</h2>
          {selectedProvince?.province ? (
            <dl>
              <div>
                <dt>ID</dt>
                <dd>{selectedProvince.province.id}</dd>
              </div>
              <div>
                <dt>Terrain</dt>
                <dd>{selectedProvince.province.terrain}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{selectedProvince.province.type}</dd>
              </div>
              <div>
                <dt>Country</dt>
                <dd>{selectedCountry?.name ?? '미배정'}</dd>
              </div>
            </dl>
          ) : (
            <p>프로빈스를 클릭하세요.</p>
          )}
          {page === 'editor' ? (
            <button type="button" className="full-button" onClick={removeAssignment}>
              Clear Selected Province
            </button>
          ) : null}
        </section>
      </aside>
    </main>
  )
}

export default App
