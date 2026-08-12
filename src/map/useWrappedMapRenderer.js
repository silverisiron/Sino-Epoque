import { useCallback, useEffect, useRef } from 'react'
import { compositeMapLayers } from './mapLayerCompositor'
import {
  colorizeRasterLayer,
  createRasterLayerMask,
  tintCanvasMask,
} from './rasterLayerColorizer'

const FULL_MAP_DIRTY = 'full'
const RESOLUTION_REFRESH_DELAY_MS = 120

function mergeDirtyRegions(currentRegion, nextRegion) {
  if (currentRegion === FULL_MAP_DIRTY || !nextRegion) {
    return FULL_MAP_DIRTY
  }

  if (!currentRegion) {
    return nextRegion
  }

  const x = Math.min(currentRegion.x, nextRegion.x)
  const y = Math.min(currentRegion.y, nextRegion.y)
  const right = Math.max(
    currentRegion.x + currentRegion.width,
    nextRegion.x + nextRegion.width,
  )
  const bottom = Math.max(
    currentRegion.y + currentRegion.height,
    nextRegion.y + nextRegion.height,
  )

  return { x, y, width: right - x, height: bottom - y }
}

function renderWrappedCanvas({
  baseCanvas,
  borderCanvas,
  dirtyRegion,
  heightmapImage,
  heightmapVisible,
  overlayCanvas,
  riversImage,
  riversVisible,
  countryLayerCanvas,
  targetCanvas,
  targetHeight,
  targetWidth,
  waterCanvas,
}) {
  let region = dirtyRegion

  if (targetCanvas.width !== targetWidth || targetCanvas.height !== targetHeight) {
    targetCanvas.width = targetWidth
    targetCanvas.height = targetHeight
    region = FULL_MAP_DIRTY
  }

  const sourceRegion =
    region === FULL_MAP_DIRTY
      ? { x: 0, y: 0, width: baseCanvas.width, height: baseCanvas.height }
      : {
          x: Math.max(0, region.x - 1),
          y: Math.max(0, region.y - 1),
          width: Math.min(baseCanvas.width, region.x + region.width + 1) -
            Math.max(0, region.x - 1),
          height: Math.min(baseCanvas.height, region.y + region.height + 1) -
            Math.max(0, region.y - 1),
        }
  const scaleX = targetWidth / baseCanvas.width
  const scaleY = targetHeight / baseCanvas.height
  const targetRegion = {
    x: sourceRegion.x * scaleX,
    y: sourceRegion.y * scaleY,
    width: sourceRegion.width * scaleX,
    height: sourceRegion.height * scaleY,
  }
  const clearX = Math.floor(targetRegion.x)
  const clearY = Math.floor(targetRegion.y)
  const clearRight = Math.ceil(targetRegion.x + targetRegion.width)
  const clearBottom = Math.ceil(targetRegion.y + targetRegion.height)
  const context = targetCanvas.getContext('2d')

  context.clearRect(clearX, clearY, clearRight - clearX, clearBottom - clearY)
  compositeMapLayers({
    baseCanvas,
    borderCanvas,
    context,
    countryLayerCanvas,
    heightmapSource: heightmapImage,
    heightmapVisible,
    overlayCanvas,
    riversSource: riversImage,
    riversVisible,
    sourceRegion,
    targetRegion,
    waterCanvas,
  })
}

export function useWrappedMapRenderer({
  baseCanvasRef,
  borderCanvasRef,
  canvasStyle,
  countryLayerCanvasRef,
  heightmapColor,
  heightmapVisible,
  wrappedMapInvalidationRef,
  mapScrollRef,
  overlayCanvasRef,
  riversColor,
  riversVisible,
  waterCanvasRef,
}) {
  const leftWrappedCanvasRef = useRef(null)
  const rightWrappedCanvasRef = useRef(null)
  const heightmapImageRef = useRef(null)
  const riversImageRef = useRef(null)
  const heightmapLayerCanvasRef = useRef(null)
  const riversLayerCanvasRef = useRef(null)
  const heightmapMaskRef = useRef(null)
  const riversMaskRef = useRef(null)
  const wrappedRenderFrameRef = useRef(null)
  const resolutionRefreshTimerRef = useRef(null)
  const wrappedDirtyRegionsRef = useRef([FULL_MAP_DIRTY, FULL_MAP_DIRTY])
  const forceWrappedMapRenderRef = useRef(false)

  const renderWrappedMaps = useCallback(() => {
    const baseCanvas = baseCanvasRef.current
    const scrollContainer = mapScrollRef.current

    if (!baseCanvas?.width || !baseCanvas.height || !scrollContainer) {
      return
    }

    const renderedWidth = baseCanvas.getBoundingClientRect().width

    if (!renderedWidth) {
      return
    }

    const resolutionScale = Math.min(
      1,
      (renderedWidth * Math.max(1, window.devicePixelRatio)) / baseCanvas.width,
    )
    const targetWidth = Math.max(1, Math.round(baseCanvas.width * resolutionScale))
    const targetHeight = Math.max(1, Math.round(baseCanvas.height * resolutionScale))
    const heightmapImage = heightmapLayerCanvasRef.current
    const riversImage = riversLayerCanvasRef.current
    const wrappedMaps = [
      {
        canvas: leftWrappedCanvasRef.current,
        isVisible:
          forceWrappedMapRenderRef.current ||
          scrollContainer.scrollLeft < renderedWidth,
      },
      {
        canvas: rightWrappedCanvasRef.current,
        isVisible:
          forceWrappedMapRenderRef.current ||
          scrollContainer.scrollLeft + scrollContainer.clientWidth > renderedWidth * 2,
      },
    ]

    for (const [index, wrappedMap] of wrappedMaps.entries()) {
      const dirtyRegion = wrappedDirtyRegionsRef.current[index]

      if (!wrappedMap.canvas || !wrappedMap.isVisible || !dirtyRegion) {
        continue
      }

      renderWrappedCanvas({
        baseCanvas,
        borderCanvas: borderCanvasRef.current,
        dirtyRegion,
        heightmapImage,
        heightmapVisible,
        overlayCanvas: overlayCanvasRef.current,
        riversImage,
        riversVisible,
        countryLayerCanvas: countryLayerCanvasRef.current,
        targetCanvas: wrappedMap.canvas,
        targetHeight,
        targetWidth,
        waterCanvas: waterCanvasRef.current,
      })
      wrappedDirtyRegionsRef.current[index] = null
    }

    forceWrappedMapRenderRef.current = false
  }, [
    baseCanvasRef,
    borderCanvasRef,
    heightmapVisible,
    mapScrollRef,
    overlayCanvasRef,
    riversVisible,
    waterCanvasRef,
    countryLayerCanvasRef,
  ])

  const queueWrappedMapRender = useCallback(() => {
    if (
      wrappedRenderFrameRef.current !== null ||
      wrappedDirtyRegionsRef.current.every((dirtyRegion) => !dirtyRegion)
    ) {
      return
    }

    wrappedRenderFrameRef.current = requestAnimationFrame(() => {
      wrappedRenderFrameRef.current = null
      renderWrappedMaps()
    })
  }, [renderWrappedMaps])

  const scheduleWrappedMapRender = useCallback(
    (dirtyRegion) => {
      wrappedDirtyRegionsRef.current = wrappedDirtyRegionsRef.current.map((currentRegion) =>
        mergeDirtyRegions(currentRegion, dirtyRegion),
      )
      queueWrappedMapRender()
    },
    [queueWrappedMapRender],
  )

  const handleHeightmapLoad = useCallback(() => {
    if (!heightmapMaskRef.current) {
      heightmapMaskRef.current = createRasterLayerMask(
        heightmapImageRef.current,
        'heightmap',
      )
    }

    colorizeRasterLayer(
      heightmapMaskRef.current,
      heightmapColor,
      heightmapLayerCanvasRef.current,
    )
    scheduleWrappedMapRender()
  }, [heightmapColor, scheduleWrappedMapRender])

  const handleRiversLoad = useCallback(() => {
    if (!riversMaskRef.current) {
      riversMaskRef.current = createRasterLayerMask(
        riversImageRef.current,
        'rivers',
      )
    }

    colorizeRasterLayer(
      riversMaskRef.current,
      riversColor,
      riversLayerCanvasRef.current,
    )
    scheduleWrappedMapRender()
  }, [riversColor, scheduleWrappedMapRender])

  useEffect(() => {
    wrappedMapInvalidationRef.current = scheduleWrappedMapRender
    scheduleWrappedMapRender()

    return () => {
      if (wrappedMapInvalidationRef.current === scheduleWrappedMapRender) {
        wrappedMapInvalidationRef.current = null
      }
    }
  }, [scheduleWrappedMapRender, wrappedMapInvalidationRef])

  useEffect(() => {
    if (!canvasStyle) {
      return undefined
    }

    // Keep wheel zoom CSS-only, then sharpen the wrapped canvases once it settles.
    resolutionRefreshTimerRef.current = window.setTimeout(() => {
      resolutionRefreshTimerRef.current = null
      scheduleWrappedMapRender()
    }, RESOLUTION_REFRESH_DELAY_MS)

    return () => {
      window.clearTimeout(resolutionRefreshTimerRef.current)
      resolutionRefreshTimerRef.current = null
    }
  }, [canvasStyle, scheduleWrappedMapRender])

  useEffect(() => {
    scheduleWrappedMapRender()
  }, [heightmapVisible, riversVisible, scheduleWrappedMapRender])

  useEffect(() => {
    if (!heightmapMaskRef.current || !heightmapLayerCanvasRef.current) {
      return
    }

    tintCanvasMask(heightmapLayerCanvasRef.current, heightmapColor)
    scheduleWrappedMapRender()
  }, [heightmapColor, scheduleWrappedMapRender])

  useEffect(() => {
    if (!riversMaskRef.current || !riversLayerCanvasRef.current) {
      return
    }

    tintCanvasMask(riversLayerCanvasRef.current, riversColor)
    scheduleWrappedMapRender()
  }, [riversColor, scheduleWrappedMapRender])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function prepareWrappedMapsForScrollbar(event) {
      if (event.target !== scrollContainer) {
        return
      }

      forceWrappedMapRenderRef.current = true
      scheduleWrappedMapRender()
    }

    scrollContainer.addEventListener('scroll', queueWrappedMapRender, { passive: true })
    scrollContainer.addEventListener('pointerdown', prepareWrappedMapsForScrollbar, {
      passive: true,
    })

    return () => {
      scrollContainer.removeEventListener('scroll', queueWrappedMapRender)
      scrollContainer.removeEventListener('pointerdown', prepareWrappedMapsForScrollbar)
    }
  }, [mapScrollRef, queueWrappedMapRender, scheduleWrappedMapRender])

  useEffect(
    () => () => {
      if (wrappedRenderFrameRef.current !== null) {
        cancelAnimationFrame(wrappedRenderFrameRef.current)
        wrappedRenderFrameRef.current = null
      }

      if (resolutionRefreshTimerRef.current !== null) {
        window.clearTimeout(resolutionRefreshTimerRef.current)
        resolutionRefreshTimerRef.current = null
      }
    },
    [],
  )

  return {
    handleHeightmapLoad,
    handleRiversLoad,
    heightmapImageRef,
    heightmapLayerCanvasRef,
    leftWrappedCanvasRef,
    rightWrappedCanvasRef,
    riversImageRef,
    riversLayerCanvasRef,
  }
}
