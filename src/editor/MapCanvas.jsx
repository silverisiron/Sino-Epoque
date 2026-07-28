import { useCallback, useEffect, useRef } from 'react'
import { MapControlGroup } from './MapControlGroup'
import { MapToolbar } from './MapToolbar'

const FULL_MAP_DIRTY = 'full'

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

function drawLayer(context, source, sourceRegion, targetRegion) {
  if (!source?.width) {
    return
  }

  context.drawImage(
    source,
    sourceRegion.x,
    sourceRegion.y,
    sourceRegion.width,
    sourceRegion.height,
    targetRegion.x,
    targetRegion.y,
    targetRegion.width,
    targetRegion.height,
  )
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
  sphereCanvas,
  targetCanvas,
  targetHeight,
  targetWidth,
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
  context.imageSmoothingEnabled = true
  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, baseCanvas, sourceRegion, targetRegion)
  drawLayer(context, overlayCanvas, sourceRegion, targetRegion)
  drawLayer(context, sphereCanvas, sourceRegion, targetRegion)
  context.globalCompositeOperation = 'multiply'

  if (heightmapVisible && heightmapImage?.naturalWidth) {
    context.globalAlpha = 0.35
    drawLayer(context, heightmapImage, sourceRegion, targetRegion)
  }

  if (riversVisible && riversImage?.naturalWidth) {
    context.globalAlpha = 1
    drawLayer(context, riversImage, sourceRegion, targetRegion)
  }

  context.globalAlpha = 1
  context.globalCompositeOperation = 'source-over'
  drawLayer(context, borderCanvas, sourceRegion, targetRegion)
}

function WrappedMapTile({
  activeTool,
  canvasRef,
  canvasStyle,
  imageRendering,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}) {
  return (
    <div className="relative min-h-px min-w-px flex-none" style={canvasStyle}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block size-full cursor-crosshair touch-none data-[tool=hand]:cursor-grab data-[tool=hand]:active:cursor-grabbing"
        data-tool={activeTool}
        style={{ imageRendering }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-hidden="true"
      />
    </div>
  )
}

export function MapCanvas({
  activeTool,
  baseCanvasRef,
  borderCanvasRef,
  canRedo,
  canUndo,
  canvasStyle,
  isMapRendering,
  mapScrollRef,
  mapImageRendering,
  mapRenderSyncRef,
  mapTrackStyle,
  onActiveToolChange,
  onPaintModeChange,
  onPaintUnitChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRedo,
  onUndo,
  onZoomIn,
  onZoomOut,
  overlayCanvasRef,
  paintMode,
  paintUnit,
  rasterLayers,
  sphereCanvasRef,
}) {
  const leftWrappedCanvasRef = useRef(null)
  const rightWrappedCanvasRef = useRef(null)
  const heightmapImageRef = useRef(null)
  const riversImageRef = useRef(null)
  const wrappedRenderFrameRef = useRef(null)
  const wrappedDirtyRegionsRef = useRef([FULL_MAP_DIRTY, FULL_MAP_DIRTY])

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
    const heightmapImage = heightmapImageRef.current
    const riversImage = riversImageRef.current
    const wrappedMaps = [
      {
        canvas: leftWrappedCanvasRef.current,
        isVisible: scrollContainer.scrollLeft < renderedWidth,
      },
      {
        canvas: rightWrappedCanvasRef.current,
        isVisible:
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
        heightmapVisible: rasterLayers.heightmap,
        overlayCanvas: overlayCanvasRef.current,
        riversImage,
        riversVisible: rasterLayers.rivers,
        sphereCanvas: sphereCanvasRef.current,
        targetCanvas: wrappedMap.canvas,
        targetHeight,
        targetWidth,
      })
      wrappedDirtyRegionsRef.current[index] = null
    }
  }, [
    baseCanvasRef,
    borderCanvasRef,
    mapScrollRef,
    overlayCanvasRef,
    rasterLayers.heightmap,
    rasterLayers.rivers,
    sphereCanvasRef,
  ])

  const queueWrappedMapRender = useCallback(() => {
    if (wrappedRenderFrameRef.current !== null) {
      return
    }

    wrappedRenderFrameRef.current = requestAnimationFrame(() => {
      wrappedRenderFrameRef.current = null
      renderWrappedMaps()
    })
  }, [renderWrappedMaps])

  const scheduleWrappedMapRender = useCallback((dirtyRegion) => {
    wrappedDirtyRegionsRef.current = wrappedDirtyRegionsRef.current.map((currentRegion) =>
      mergeDirtyRegions(currentRegion, dirtyRegion),
    )
    queueWrappedMapRender()
  }, [queueWrappedMapRender])

  useEffect(() => {
    mapRenderSyncRef.current = scheduleWrappedMapRender
    scheduleWrappedMapRender()

    return () => {
      if (mapRenderSyncRef.current === scheduleWrappedMapRender) {
        mapRenderSyncRef.current = null
      }
    }
  }, [mapRenderSyncRef, scheduleWrappedMapRender])

  useEffect(() => {
    scheduleWrappedMapRender()
  }, [canvasStyle, rasterLayers.heightmap, rasterLayers.rivers, scheduleWrappedMapRender])

  useEffect(() => {
    const scrollContainer = mapScrollRef.current

    if (!scrollContainer) {
      return undefined
    }

    scrollContainer.addEventListener('scroll', queueWrappedMapRender, { passive: true })

    return () => scrollContainer.removeEventListener('scroll', queueWrappedMapRender)
  }, [mapScrollRef, queueWrappedMapRender])

  useEffect(
    () => () => {
      if (wrappedRenderFrameRef.current !== null) {
        cancelAnimationFrame(wrappedRenderFrameRef.current)
        wrappedRenderFrameRef.current = null
      }
    },
    [],
  )

  return (
    <section
      className="relative min-h-0 min-w-0 bg-white min-[56.25rem]:col-start-1 min-[56.25rem]:row-start-2 min-[56.25rem]:row-end-4"
      aria-label="지도 캔버스"
    >
      <div
        className="scrollbar-custom relative size-full overflow-auto bg-canvas max-[56.25rem]:max-h-[60vh]"
        ref={mapScrollRef}
      >
        <div className="grid min-h-full min-w-full place-items-center">
          <div className="flex min-h-px min-w-px" style={mapTrackStyle}>
            <WrappedMapTile
              activeTool={activeTool}
              canvasRef={leftWrappedCanvasRef}
              canvasStyle={canvasStyle}
              imageRendering={mapImageRendering}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <div className="relative min-h-px min-w-px flex-none" style={canvasStyle}>
              <canvas
                ref={baseCanvasRef}
                className="absolute inset-0 block size-full cursor-crosshair touch-none [image-rendering:pixelated] data-[tool=hand]:cursor-grab data-[tool=hand]:active:cursor-grabbing"
                data-tool={activeTool}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="프로빈스 백지도"
              />
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 z-1 block size-full [image-rendering:pixelated]"
                aria-hidden="true"
              />
              <canvas
                ref={sphereCanvasRef}
                className="pointer-events-none absolute inset-0 z-2 block size-full [image-rendering:pixelated]"
                aria-hidden="true"
              />
              {rasterLayers.heightmap ? (
                <img
                  ref={heightmapImageRef}
                  className="pointer-events-none absolute inset-0 z-3 block size-full object-fill opacity-35 mix-blend-multiply [image-rendering:pixelated]"
                  src="/maps/base/bmp/heightmap.bmp"
                  width="5632"
                  height="2048"
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  onLoad={() => scheduleWrappedMapRender()}
                />
              ) : null}
              {rasterLayers.rivers ? (
                <img
                  ref={riversImageRef}
                  className="pointer-events-none absolute inset-0 z-4 block size-full object-fill mix-blend-multiply [image-rendering:pixelated]"
                  src="/maps/base/bmp/rivers.bmp"
                  width="5632"
                  height="2048"
                  alt=""
                  aria-hidden="true"
                  draggable="false"
                  onLoad={() => scheduleWrappedMapRender()}
                />
              ) : null}
              <canvas
                ref={borderCanvasRef}
                className="pointer-events-none absolute inset-0 z-5 block size-full [image-rendering:auto]"
                aria-hidden="true"
              />
            </div>
            <WrappedMapTile
              activeTool={activeTool}
              canvasRef={rightWrappedCanvasRef}
              canvasStyle={canvasStyle}
              imageRendering={mapImageRendering}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
          </div>
        </div>
        {isMapRendering ? (
          <div className="pointer-events-none absolute inset-0 z-6 grid place-items-center">
            <div
              className="flex items-center gap-2.5 bg-white text-sm font-semibold"
              role="status"
              aria-live="polite"
            >
              <span
                className="size-4.5 animate-[spin_0.8s_linear_infinite] rounded-full border-[3px] border-line border-t-ink"
                aria-hidden="true"
              />
              <span>로딩중...</span>
            </div>
          </div>
        ) : null}
      </div>

      <MapControlGroup label="편집 기록" position="left">
        <button
          type="button"
          aria-label="실행 취소"
          disabled={!canUndo}
          onClick={onUndo}
          title="실행 취소 (Ctrl/Cmd+Z)"
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="다시 실행"
          disabled={!canRedo}
          onClick={onRedo}
          title="다시 실행 (Ctrl/Cmd+Y)"
        >
          ↷
        </button>
      </MapControlGroup>

      <MapControlGroup label="확대 축소" position="right">
        <button type="button" aria-label="확대" onClick={onZoomIn}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={onZoomOut}>
          -
        </button>
      </MapControlGroup>

      <MapToolbar
        activeTool={activeTool}
        onActiveToolChange={onActiveToolChange}
        onPaintModeChange={onPaintModeChange}
        onPaintUnitChange={onPaintUnitChange}
        paintMode={paintMode}
        paintUnit={paintUnit}
      />
    </section>
  )
}
