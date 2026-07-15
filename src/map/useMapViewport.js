import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { clampZoom } from './mapData'

export function useMapViewport(mapSize) {
  const mapScrollRef = useRef(null)
  const zoomRef = useRef(0.35)
  const [zoom, setZoom] = useState(0.35)

  useEffect(() => {
    zoomRef.current = zoom
  }, [zoom])

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

  const canvasStyle = useMemo(
    () =>
      mapSize
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
