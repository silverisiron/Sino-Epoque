import { useEffect, useRef } from 'react'
import { createBorderImageData } from './canvasRenderers'
import { colorizeCanvasMask, tintCanvasMask } from './rasterLayerColorizer'

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

export function useMapBorderRenderer({
  borderCanvasRef,
  borderColor,
  borderMode,
  invalidateWrappedMap,
  mapSize,
  provinceByRgbRef,
  setIsMapRendering,
  sourceImageDataRef,
  stateByProvinceRef,
}) {
  const borderMaskCanvasCacheRef = useRef(new Map())
  const cachedMapSizeRef = useRef(mapSize)
  const renderedBorderModeRef = useRef(null)

  useEffect(() => {
    let ignore = false

    async function renderBorderMode() {
      if (cachedMapSizeRef.current !== mapSize) {
        borderMaskCanvasCacheRef.current.clear()
        cachedMapSizeRef.current = mapSize
        renderedBorderModeRef.current = null
      }

      if (!mapSize || !sourceImageDataRef.current) {
        return
      }

      const borderCanvas = borderCanvasRef.current
      const borderContext = borderCanvas.getContext('2d')

      function putTintedBorder(borderMaskCanvas) {
        colorizeCanvasMask(borderMaskCanvas, borderColor, borderCanvas)
      }

      if (borderMode === 'none') {
        borderContext.clearRect(0, 0, borderCanvas.width, borderCanvas.height)
        renderedBorderModeRef.current = null
        invalidateWrappedMap()
        setIsMapRendering(false)
        return
      }

      // Border geometry is cached by mode; changing color only tints its alpha mask.
      const cachedBorder = borderMaskCanvasCacheRef.current.get(borderMode)

      if (cachedBorder) {
        if (renderedBorderModeRef.current === borderMode) {
          tintCanvasMask(borderCanvas, borderColor)
        } else {
          putTintedBorder(cachedBorder)
          renderedBorderModeRef.current = borderMode
        }
        invalidateWrappedMap()
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
      const borderMaskCanvas = document.createElement('canvas')
      borderMaskCanvas.width = borderImageData.width
      borderMaskCanvas.height = borderImageData.height
      borderMaskCanvas.getContext('2d').putImageData(borderImageData, 0, 0)
      borderMaskCanvasCacheRef.current.set(borderMode, borderMaskCanvas)
      putTintedBorder(borderMaskCanvas)
      renderedBorderModeRef.current = borderMode
      invalidateWrappedMap()
      setIsMapRendering(false)
    }

    renderBorderMode()

    return () => {
      ignore = true
    }
  }, [
    borderCanvasRef,
    borderColor,
    borderMode,
    invalidateWrappedMap,
    mapSize,
    provinceByRgbRef,
    setIsMapRendering,
    sourceImageDataRef,
    stateByProvinceRef,
  ])
}
