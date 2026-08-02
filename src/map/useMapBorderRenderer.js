import { useEffect, useRef } from 'react'
import { createBorderImageData } from './canvasRenderers'

function waitForPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

export function useMapBorderRenderer({
  borderCanvasRef,
  borderMode,
  invalidateWrappedMap,
  mapSize,
  provinceByRgbRef,
  setIsMapRendering,
  sourceImageDataRef,
  stateByProvinceRef,
}) {
  const borderImageDataCacheRef = useRef(new Map())
  const cachedMapSizeRef = useRef(mapSize)

  useEffect(() => {
    let ignore = false

    async function renderBorderMode() {
      if (cachedMapSizeRef.current !== mapSize) {
        borderImageDataCacheRef.current.clear()
        cachedMapSizeRef.current = mapSize
      }

      if (!mapSize || !sourceImageDataRef.current) {
        return
      }

      const borderCanvas = borderCanvasRef.current
      const borderContext = borderCanvas.getContext('2d')

      if (borderMode === 'none') {
        borderContext.clearRect(0, 0, borderCanvas.width, borderCanvas.height)
        invalidateWrappedMap()
        setIsMapRendering(false)
        return
      }

      const cachedBorder = borderImageDataCacheRef.current.get(borderMode)

      if (cachedBorder) {
        borderContext.putImageData(cachedBorder, 0, 0)
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
      borderImageDataCacheRef.current.set(borderMode, borderImageData)
      borderContext.putImageData(borderImageData, 0, 0)
      invalidateWrappedMap()
      setIsMapRendering(false)
    }

    renderBorderMode()

    return () => {
      ignore = true
    }
  }, [
    borderCanvasRef,
    borderMode,
    invalidateWrappedMap,
    mapSize,
    provinceByRgbRef,
    setIsMapRendering,
    sourceImageDataRef,
    stateByProvinceRef,
  ])
}
