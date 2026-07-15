import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { CountryPanel } from './editor/CountryPanel'
import { MapCanvas } from './editor/MapCanvas'
import { PresetLoader } from './editor/PresetLoader'
import { ProvinceInfo } from './editor/ProvinceInfo'
import {
  buildProvincePixelCache,
  drawAllOverlay,
  drawBlankMap,
  drawBorderMap,
  drawProvinceOverlay,
  drawProvincesOverlay,
} from './map/canvasRenderers'
import {
  DEFINITION_PATH,
  MAP_IMAGE_PATH,
  PRESET_INDEX_PATH,
  STATES_INDEX_PATH,
} from './map/constants'
import { clampZoom, isWater, parseDefinitionCsv, waitForPaint } from './map/mapData'

function App() {
  const mapScrollRef = useRef(null)
  const baseCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const borderCanvasRef = useRef(null)
  const sourceImageDataRef = useRef(null)
  const overlayImageDataRef = useRef(null)
  const provinceByRgbRef = useRef(new Map())
  const provinceByIdRef = useRef(new Map())
  const provincePixelCacheRef = useRef(new Map())
  const statesByIdRef = useRef(new Map())
  const stateByProvinceRef = useRef(new Map())
  const assignmentsRef = useRef({})
  const zoomRef = useRef(0.35)
  const isPaintingRef = useRef(false)
  const lastPaintedProvinceRef = useRef(null)
  const panRef = useRef(null)

  const [page, setPage] = useState('editor')
  const [status, setStatus] = useState('지도 데이터를 불러오는 중입니다.')
  const [isMapRendering, setIsMapRendering] = useState(true)
  const [mapSize, setMapSize] = useState(null)
  const [zoom, setZoom] = useState(0.35)
  const [activeTool, setActiveTool] = useState('paint')
  const [paintMode, setPaintMode] = useState('single')
  const [paintUnit, setPaintUnit] = useState('province')
  const [borderMode, setBorderMode] = useState('province')
  const [countries, setCountries] = useState({
    '#d94645': { name: '국가 1' },
  })
  const [activeColor, setActiveColor] = useState('#d94645')
  const [assignments, setAssignments] = useState({})
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
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
        setIsMapRendering(true)
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

        const statesResponse = await fetch(STATES_INDEX_PATH)

        if (statesResponse.ok) {
          const statesIndex = await statesResponse.json()
          statesByIdRef.current = new Map(
            statesIndex.states.map((state) => [
              state.id,
              {
                ...state,
                provinces: state.provinces
                  .map((provinceId) => provinceById.get(provinceId))
                  .filter(Boolean),
              },
            ]),
          )
          stateByProvinceRef.current = new Map(Object.entries(statesIndex.provinceToState))
        }

        const image = new Image()
        image.src = MAP_IMAGE_PATH
        await image.decode()

        if (ignore) {
          return
        }

        const baseCanvas = baseCanvasRef.current
        const overlayCanvas = overlayCanvasRef.current
        const borderCanvas = borderCanvasRef.current
        const baseContext = baseCanvas.getContext('2d', { willReadFrequently: true })

        baseCanvas.width = image.naturalWidth
        baseCanvas.height = image.naturalHeight
        overlayCanvas.width = image.naturalWidth
        overlayCanvas.height = image.naturalHeight
        borderCanvas.width = image.naturalWidth
        borderCanvas.height = image.naturalHeight

        baseContext.drawImage(image, 0, 0)

        const sourceImageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
        sourceImageDataRef.current = sourceImageData
        overlayImageDataRef.current = new ImageData(baseCanvas.width, baseCanvas.height)
        provincePixelCacheRef.current = buildProvincePixelCache(sourceImageData, provinceByRgb)

        await waitForPaint()
        drawBlankMap(baseCanvas, sourceImageData, provinceByRgb)
        drawBorderMap(
          borderCanvas,
          sourceImageData,
          provinceByRgb,
          stateByProvinceRef.current,
          'province',
        )

        setMapSize({ width: baseCanvas.width, height: baseCanvas.height })
        setStatus('지도 로드 완료')
        setIsMapRendering(false)
      } catch (error) {
        if (!ignore) {
          setStatus(error.message)
          setIsMapRendering(false)
        }
      }
    }

    loadMapData()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function renderBorderMode() {
      if (!sourceImageDataRef.current) {
        return
      }

      setIsMapRendering(true)
      await waitForPaint()

      if (ignore) {
        return
      }

      drawBorderMap(
        borderCanvasRef.current,
        sourceImageDataRef.current,
        provinceByRgbRef.current,
        stateByProvinceRef.current,
        borderMode,
      )
      setIsMapRendering(false)
    }

    renderBorderMode()

    return () => {
      ignore = true
    }
  }, [borderMode])

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

    const stateId = stateByProvinceRef.current.get(clicked.province.id)
    const clickedState = stateId ? statesByIdRef.current.get(stateId) : null
    setSelectedState(clickedState ?? null)

    if (page !== 'editor' || !activeCountry || activeTool !== 'paint' || isWater(clicked.province)) {
      return
    }

    if (paintUnit === 'state' && clickedState) {
      const nextAssignments = { ...assignmentsRef.current }
      const landProvinces = clickedState.provinces.filter((province) => !isWater(province))

      for (const province of landProvinces) {
        nextAssignments[province.id] = activeColor
      }

      assignmentsRef.current = nextAssignments
      drawProvincesOverlay(
        overlayCanvasRef.current,
        overlayImageDataRef.current,
        provincePixelCacheRef.current,
        landProvinces,
        activeColor,
      )
    } else {
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
    }

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
      const stateId = stateByProvinceRef.current.get(selectedProvince.province.id)
      const selectedProvinceState = stateId ? statesByIdRef.current.get(stateId) : null

      if (paintUnit === 'state' && selectedProvinceState) {
        for (const province of selectedProvinceState.provinces) {
          delete nextAssignments[province.id]
        }
      } else {
        delete nextAssignments[selectedProvince.province.id]
      }

      assignmentsRef.current = nextAssignments

      if (paintUnit === 'state' && selectedProvinceState) {
        drawProvincesOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          selectedProvinceState.provinces,
          null,
        )
      } else {
        drawProvinceOverlay(
          overlayCanvasRef.current,
          overlayImageDataRef.current,
          provincePixelCacheRef.current,
          selectedProvince.province,
          null,
        )
      }

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

      <MapCanvas
        activeTool={activeTool}
        baseCanvasRef={baseCanvasRef}
        borderCanvasRef={borderCanvasRef}
        canvasStyle={canvasStyle}
        isMapRendering={isMapRendering}
        mapScrollRef={mapScrollRef}
        mapSize={mapSize}
        onActiveToolChange={setActiveTool}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onZoomIn={() => updateZoom(zoomRef.current + 0.15)}
        onZoomOut={() => updateZoom(zoomRef.current - 0.15)}
        overlayCanvasRef={overlayCanvasRef}
        page={page}
        zoom={zoom}
      />

      <aside className="side-panel" aria-label="맵 도구">
        {page === 'editor' ? (
          <CountryPanel
            activeColor={activeColor}
            borderMode={borderMode}
            countries={countries}
            onAddCountry={addCountry}
            onBorderModeChange={setBorderMode}
            onCountryColorChange={updateCountryColor}
            onCountryNameChange={updateCountryName}
            onPaintModeChange={setPaintMode}
            onPaintUnitChange={setPaintUnit}
            onSelectColor={setActiveColor}
            paintMode={paintMode}
            paintUnit={paintUnit}
            preset={preset}
          />
        ) : (
          <PresetLoader
            onLoadPreset={() => loadPreset()}
            onSelectedPresetPathChange={setSelectedPresetPath}
            presetIndex={presetIndex}
            selectedPresetPath={selectedPresetPath}
          />
        )}

        <ProvinceInfo
          isEditor={page === 'editor'}
          onRemoveAssignment={removeAssignment}
          selectedCountry={selectedCountry}
          selectedProvince={selectedProvince}
          selectedState={selectedState}
        />
      </aside>
    </main>
  )
}

export default App
