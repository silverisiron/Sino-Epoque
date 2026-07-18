import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clampZoom } from './mapData'

const WHEEL_ZOOM_SENSITIVITY = 0.001

export function useMapViewport(mapSize) {
  const mapScrollRef = useRef(null)
  const zoomRef = useRef(0)
  const wheelDeltaRef = useRef(0)
  const wheelAnchorRef = useRef(null)
  const wheelFrameRef = useRef(null)
  const hasInitializedZoomRef = useRef(false)
  const [zoom, setZoom] = useState(0)
  const [viewportSize, setViewportSize] = useState(null)

  const minZoom = useMemo(() => {
    if (!mapSize || !viewportSize) {
      return 0
    }

    return Math.min(viewportSize.width / mapSize.width, viewportSize.height / mapSize.height)
  }, [mapSize, viewportSize])

  const updateZoom = useCallback(
    (nextZoom, anchor) => {
      const scrollContainer = mapScrollRef.current
      const currentZoom = zoomRef.current
      const clampedZoom = clampZoom(nextZoom, minZoom)

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
    [mapSize, minZoom],
  )

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setViewportSize({ width, height })
    })

    resizeObserver.observe(scrollContainer)

    return () => resizeObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!minZoom) {
      return
    }

    const nextZoom = hasInitializedZoomRef.current
      ? Math.max(zoomRef.current, minZoom)
      : minZoom

    hasInitializedZoomRef.current = true
    zoomRef.current = nextZoom
    setZoom(nextZoom)
  }, [minZoom])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function handleNativeWheel(event) {
      event.preventDefault()
      wheelDeltaRef.current += event.deltaY
      wheelAnchorRef.current = event

      if (wheelFrameRef.current !== null) {
        return
      }

      wheelFrameRef.current = requestAnimationFrame(() => {
        const zoomFactor = Math.exp(-wheelDeltaRef.current * WHEEL_ZOOM_SENSITIVITY)
        const anchor = wheelAnchorRef.current

        wheelDeltaRef.current = 0
        wheelAnchorRef.current = null
        wheelFrameRef.current = null
        updateZoom(zoomRef.current * zoomFactor, anchor)
      })
    }

    scrollContainer.addEventListener('wheel', handleNativeWheel, { passive: false })

    return () => {
      scrollContainer.removeEventListener('wheel', handleNativeWheel)

      if (wheelFrameRef.current !== null) {
        cancelAnimationFrame(wheelFrameRef.current)
      }
    }
  }, [updateZoom])

  const canvasStyle = useMemo(
    () =>
      mapSize && zoom
        ? { width: `${mapSize.width * zoom}px`, height: `${mapSize.height * zoom}px` }
        : undefined,
    [mapSize, zoom],
  )

  return {
    canvasStyle,
    mapScrollRef,
    updateZoom,
    zoom,
    zoomRef,
  }
}
