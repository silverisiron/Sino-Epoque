import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clampZoom } from './mapData'

const WHEEL_ZOOM_SENSITIVITY = 0.001
const MAX_ZOOM = 8
const MOBILE_MAX_ZOOM = 2
const MOBILE_QUERY = '(max-width: 56.249rem)'
const WRAPPED_MAP_COUNT = 3

export function useMapViewport(mapSize) {
  const mapScrollRef = useRef(null)
  const mapSizeRef = useRef(mapSize)
  const maxZoomRef = useRef(MAX_ZOOM)
  const minZoomRef = useRef(0)
  const zoomRef = useRef(0)
  const wheelDeltaRef = useRef(0)
  const wheelAnchorRef = useRef(null)
  const wheelFrameRef = useRef(null)
  const hasInitializedZoomRef = useRef(false)
  const hasInitializedHorizontalScrollRef = useRef(false)
  const [zoom, setZoom] = useState(0)
  const [viewportSize, setViewportSize] = useState(null)

  const minZoom = useMemo(() => {
    if (!mapSize || !viewportSize) {
      return 0
    }

    return Math.min(viewportSize.width / mapSize.width, viewportSize.height / mapSize.height)
  }, [mapSize, viewportSize])

  useEffect(() => {
    mapSizeRef.current = mapSize
  }, [mapSize])

  useEffect(() => {
    minZoomRef.current = minZoom
  }, [minZoom])

  const updateZoom = useCallback((nextZoom, anchor) => {
    const scrollContainer = mapScrollRef.current
    const currentZoom = zoomRef.current
    const clampedZoom = clampZoom(nextZoom, minZoomRef.current, maxZoomRef.current)

    if (!scrollContainer || !mapSizeRef.current || clampedZoom === currentZoom) {
      return
    }

    const rect = scrollContainer.getBoundingClientRect()
    const anchorX = anchor ? anchor.clientX - rect.left : rect.width / 2
    const anchorY = anchor ? anchor.clientY - rect.top : rect.height / 2
    const currentMapWidth = mapSizeRef.current.width * currentZoom
    const wrappedX =
      ((scrollContainer.scrollLeft + anchorX) % currentMapWidth + currentMapWidth) %
      currentMapWidth
    const mapX = wrappedX / currentZoom
    const mapY = (scrollContainer.scrollTop + anchorY) / currentZoom
    const nextMapWidth = mapSizeRef.current.width * clampedZoom

    zoomRef.current = clampedZoom
    setZoom(clampedZoom)

    requestAnimationFrame(() => {
      scrollContainer.scrollLeft = nextMapWidth + mapX * clampedZoom - anchorX
      scrollContainer.scrollTop = mapY * clampedZoom - anchorY
    })
  }, [])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const nextMaxZoom = window.matchMedia(MOBILE_QUERY).matches
        ? MOBILE_MAX_ZOOM
        : MAX_ZOOM

      maxZoomRef.current = nextMaxZoom
      setViewportSize({ width, height })

      if (zoomRef.current > nextMaxZoom) {
        updateZoom(nextMaxZoom)
      }
    })

    resizeObserver.observe(scrollContainer)

    return () => resizeObserver.disconnect()
  }, [updateZoom])

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

    if (
      !scrollContainer ||
      !mapSize ||
      !zoom ||
      hasInitializedHorizontalScrollRef.current
    ) {
      return
    }

    hasInitializedHorizontalScrollRef.current = true

    requestAnimationFrame(() => {
      scrollContainer.scrollLeft = mapSize.width * zoom
    })
  }, [mapSize, zoom])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function keepMiddleMapInView() {
      const currentMapSize = mapSizeRef.current
      const currentZoom = zoomRef.current

      if (!currentMapSize || !currentZoom) {
        return
      }

      const mapWidth = currentMapSize.width * currentZoom
      const scrollLeft = scrollContainer.scrollLeft

      if (scrollLeft < mapWidth * 0.5) {
        scrollContainer.scrollLeft = scrollLeft + mapWidth
      } else if (scrollLeft > mapWidth * 1.5) {
        scrollContainer.scrollLeft = scrollLeft - mapWidth
      }
    }

    scrollContainer.addEventListener('scroll', keepMiddleMapInView, { passive: true })

    return () => scrollContainer.removeEventListener('scroll', keepMiddleMapInView)
  }, [])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function handleNativeWheel(event) {
      event.preventDefault()
      wheelDeltaRef.current += event.deltaY
      wheelAnchorRef.current = { clientX: event.clientX, clientY: event.clientY }

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

      wheelFrameRef.current = null
      wheelDeltaRef.current = 0
      wheelAnchorRef.current = null
    }
  }, [updateZoom])

  const canvasStyle = useMemo(
    () =>
      mapSize && zoom
        ? { width: `${mapSize.width * zoom}px`, height: `${mapSize.height * zoom}px` }
        : undefined,
    [mapSize, zoom],
  )
  const mapTrackStyle = useMemo(
    () =>
      mapSize && zoom
        ? {
            width: `${mapSize.width * zoom * WRAPPED_MAP_COUNT}px`,
            height: `${mapSize.height * zoom}px`,
          }
        : undefined,
    [mapSize, zoom],
  )

  return {
    canvasStyle,
    mapImageRendering: zoom < 1 ? 'auto' : 'pixelated',
    mapScrollRef,
    mapTrackStyle,
    updateZoom,
    zoom,
    zoomRef,
  }
}
