import { useEffect, useRef } from 'react'

export function useWrappedHorizontalScroll({
  mapScrollRef,
  mapSize,
  mapSizeRef,
  zoom,
  zoomRef,
}) {
  const hasInitializedHorizontalScrollRef = useRef(false)
  const isHorizontalScrollbarDraggingRef = useRef(false)

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
  }, [mapScrollRef, mapSize, zoom])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    function keepMiddleMapInView() {
      const currentMapSize = mapSizeRef.current
      const currentZoom = zoomRef.current

      if (
        !currentMapSize ||
        !currentZoom ||
        isHorizontalScrollbarDraggingRef.current
      ) {
        return
      }

      const mapWidth = currentMapSize.width * currentZoom
      const scrollLeft = scrollContainer.scrollLeft
      let nextScrollLeft = scrollLeft

      while (nextScrollLeft < mapWidth * 0.5) {
        nextScrollLeft += mapWidth
      }

      while (nextScrollLeft > mapWidth * 1.5) {
        nextScrollLeft -= mapWidth
      }

      if (nextScrollLeft !== scrollLeft) {
        scrollContainer.scrollLeft = nextScrollLeft
      }
    }

    function handlePointerDown(event) {
      if (event.target !== scrollContainer) {
        return
      }

      const rect = scrollContainer.getBoundingClientRect()
      const scrollbarHeight = scrollContainer.offsetHeight - scrollContainer.clientHeight
      const isHorizontalScrollbar =
        scrollbarHeight === 0 || event.clientY >= rect.bottom - scrollbarHeight

      if (isHorizontalScrollbar) {
        isHorizontalScrollbarDraggingRef.current = true
      }
    }

    function finishScrollbarDrag() {
      if (!isHorizontalScrollbarDraggingRef.current) {
        return
      }

      isHorizontalScrollbarDraggingRef.current = false
      requestAnimationFrame(keepMiddleMapInView)
    }

    scrollContainer.addEventListener('scroll', keepMiddleMapInView, { passive: true })
    scrollContainer.addEventListener('pointerdown', handlePointerDown, { passive: true })
    scrollContainer.addEventListener('scrollend', finishScrollbarDrag, { passive: true })
    window.addEventListener('pointerup', finishScrollbarDrag)
    window.addEventListener('pointercancel', finishScrollbarDrag)
    window.addEventListener('mouseup', finishScrollbarDrag)
    window.addEventListener('touchend', finishScrollbarDrag)
    window.addEventListener('touchcancel', finishScrollbarDrag)
    window.addEventListener('blur', finishScrollbarDrag)

    return () => {
      scrollContainer.removeEventListener('scroll', keepMiddleMapInView)
      scrollContainer.removeEventListener('pointerdown', handlePointerDown)
      scrollContainer.removeEventListener('scrollend', finishScrollbarDrag)
      window.removeEventListener('pointerup', finishScrollbarDrag)
      window.removeEventListener('pointercancel', finishScrollbarDrag)
      window.removeEventListener('mouseup', finishScrollbarDrag)
      window.removeEventListener('touchend', finishScrollbarDrag)
      window.removeEventListener('touchcancel', finishScrollbarDrag)
      window.removeEventListener('blur', finishScrollbarDrag)
    }
  }, [mapScrollRef, mapSizeRef, zoomRef])
}
