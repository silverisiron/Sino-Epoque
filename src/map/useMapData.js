import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildProvincePixelCache,
  createBorderImageData,
  drawAllOverlay,
  drawBlankMap,
  drawSphereLayer,
} from './canvasRenderers'
import {
  DEFINITION_PATH,
  MAP_IMAGE_PATH,
  PRESET_INDEX_PATH,
  STATES_INDEX_PATH,
} from './constants'
import { parseDefinitionCsv, waitForPaint } from './mapData'

export function useMapData(borderMode) {
  const baseCanvasRef = useRef(null)
  const overlayCanvasRef = useRef(null)
  const sphereCanvasRef = useRef(null)
  const borderCanvasRef = useRef(null)
  const borderImageDataCacheRef = useRef(new Map())
  const mapRenderSyncRef = useRef(null)
  const sourceImageDataRef = useRef(null)
  const overlayImageDataRef = useRef(null)
  const sphereImageDataRef = useRef(null)
  const provinceByRgbRef = useRef(new Map())
  const provinceByIdRef = useRef(new Map())
  const provincePixelCacheRef = useRef(new Map())
  const statesByIdRef = useRef(new Map())
  const stateByProvinceRef = useRef(new Map())

  const [status, setStatus] = useState('지도 데이터를 불러오는 중입니다.')
  const [isMapRendering, setIsMapRendering] = useState(true)
  const [mapSize, setMapSize] = useState(null)
  const [presetIndex, setPresetIndex] = useState([])
  const [selectedPresetPath, setSelectedPresetPath] = useState('')

  const syncWrappedMap = useCallback((dirtyRegion) => {
    mapRenderSyncRef.current?.(dirtyRegion)
  }, [])

  const redrawAllOverlay = useCallback((assignments, countries) => {
    drawAllOverlay(
      overlayCanvasRef.current,
      overlayImageDataRef.current,
      provincePixelCacheRef.current,
      provinceByIdRef.current,
      assignments,
      countries,
    )
    syncWrappedMap()
  }, [syncWrappedMap])

  const redrawSphereLayer = useCallback((
    assignments,
    countries,
    autonomyTypes,
    powerRankTypes,
    powerBlocs,
    settings,
  ) => {
    drawSphereLayer(
      sphereCanvasRef.current,
      sphereImageDataRef.current,
      provincePixelCacheRef.current,
      assignments,
      countries,
      autonomyTypes,
      powerRankTypes,
      powerBlocs,
      settings,
    )
    syncWrappedMap()
  }, [syncWrappedMap])

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
        const sphereCanvas = sphereCanvasRef.current
        const borderCanvas = borderCanvasRef.current
        const baseContext = baseCanvas.getContext('2d', { willReadFrequently: true })

        baseCanvas.width = image.naturalWidth
        baseCanvas.height = image.naturalHeight
        overlayCanvas.width = image.naturalWidth
        overlayCanvas.height = image.naturalHeight
        sphereCanvas.width = image.naturalWidth
        sphereCanvas.height = image.naturalHeight
        borderCanvas.width = image.naturalWidth
        borderCanvas.height = image.naturalHeight
        borderImageDataCacheRef.current.clear()

        baseContext.drawImage(image, 0, 0)

        const sourceImageData = baseContext.getImageData(0, 0, baseCanvas.width, baseCanvas.height)
        sourceImageDataRef.current = sourceImageData
        overlayImageDataRef.current = new ImageData(baseCanvas.width, baseCanvas.height)
        sphereImageDataRef.current = new ImageData(baseCanvas.width, baseCanvas.height)
        provincePixelCacheRef.current = buildProvincePixelCache(sourceImageData, provinceByRgb)

        await waitForPaint()
        drawBlankMap(baseCanvas, sourceImageData, provinceByRgb)
        syncWrappedMap()

        setMapSize({ width: baseCanvas.width, height: baseCanvas.height })
        setStatus('지도 로드 완료')
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
  }, [syncWrappedMap])

  useEffect(() => {
    let ignore = false

    async function renderBorderMode() {
      if (!mapSize || !sourceImageDataRef.current) {
        return
      }

      const borderCanvas = borderCanvasRef.current
      const borderContext = borderCanvas.getContext('2d')

      if (borderMode === 'none') {
        borderContext.clearRect(0, 0, borderCanvas.width, borderCanvas.height)
        syncWrappedMap()
        setIsMapRendering(false)
        return
      }

      const cachedBorder = borderImageDataCacheRef.current.get(borderMode)

      if (cachedBorder) {
        borderContext.putImageData(cachedBorder, 0, 0)
        syncWrappedMap()
        setIsMapRendering(false)
        return
      }

      setIsMapRendering(true)
      await waitForPaint()

      if (ignore) {
        return
      }

      const borderImageData = createBorderImageData(
        sourceImageDataRef.current,
        provinceByRgbRef.current,
        stateByProvinceRef.current,
        borderMode,
      )
      borderImageDataCacheRef.current.set(borderMode, borderImageData)
      borderContext.putImageData(borderImageData, 0, 0)
      syncWrappedMap()
      setIsMapRendering(false)
    }

    renderBorderMode()

    return () => {
      ignore = true
    }
  }, [borderMode, mapSize, syncWrappedMap])

  return {
    baseCanvasRef,
    borderCanvasRef,
    isMapRendering,
    mapRenderSyncRef,
    mapSize,
    overlayCanvasRef,
    overlayImageDataRef,
    presetIndex,
    provinceByIdRef,
    provinceByRgbRef,
    provincePixelCacheRef,
    redrawAllOverlay,
    redrawSphereLayer,
    selectedPresetPath,
    setSelectedPresetPath,
    setStatus,
    sourceImageDataRef,
    sphereCanvasRef,
    sphereImageDataRef,
    stateByProvinceRef,
    statesByIdRef,
    status,
    syncWrappedMap,
  }
}
