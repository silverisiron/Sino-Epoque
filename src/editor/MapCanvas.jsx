import { lazy, Suspense } from 'react'
import Rotate3d from 'lucide-react/dist/esm/icons/rotate-3d.mjs'
import { useMapViewport } from '../map/useMapViewport'
import { useWrappedMapRenderer } from '../map/useWrappedMapRenderer'
import { MapToolbar } from './MapToolbar'

const ThreeHemisphereMap = lazy(() =>
  import('./ThreeHemisphereMap').then((module) => ({
    default: module.ThreeHemisphereMap,
  })),
)

function MapControlGroup({ children, label, position }) {
  const positionClassName = position === 'left' ? 'left-4' : 'right-4'

  return (
    <div
      className={`fixed bottom-4 z-20 ${positionClassName} grid gap-1 [&>button]:min-h-7 [&>button]:w-8 [&>button]:text-lg [&>button]:leading-none`}
      role="toolbar"
      aria-label={label}
    >
      {children}
    </div>
  )
}

function WrappedMapTile({
  effectiveTool,
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
        data-tool={effectiveTool}
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
  viewMode,
  effectiveTool,
  baseCanvasRef,
  borderCanvasRef,
  canRedo,
  canUndo,
  countryLayerCanvasRef,
  isMapRendering,
  mapScrollRef,
  wrappedMapInvalidationRef,
  mapSize,
  onToolSelect,
  onPaintModeChange,
  onPaintUnitChange,
  onProvinceInspect,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onRedo,
  onUndo,
  onViewModeChange,
  overlayCanvasRef,
  paintMode,
  paintUnit,
  provinceByRgbRef,
  rasterLayerColors,
  rasterLayers,
  sourceImageDataRef,
  waterCanvasRef,
}) {
  const isThreeDimensional = viewMode === '3d'
  const viewport = useMapViewport(mapSize, mapScrollRef)
  const {
    handleHeightmapLoad,
    handleRiversLoad,
    heightmapImageRef,
    heightmapLayerCanvasRef,
    leftWrappedCanvasRef,
    mapTextureCanvasRef,
    mapTextureUpdateListenerRef,
    rightWrappedCanvasRef,
    riversImageRef,
    riversLayerCanvasRef,
  } = useWrappedMapRenderer({
    baseCanvasRef,
    borderCanvasRef,
    canvasStyle: viewport.canvasStyle,
    heightmapColor: rasterLayerColors.heightmap,
    heightmapVisible: rasterLayers.heightmap,
    isThreeDimensional,
    wrappedMapInvalidationRef,
    mapScrollRef,
    overlayCanvasRef,
    riversColor: rasterLayerColors.rivers,
    riversVisible: rasterLayers.rivers,
    waterCanvasRef,
    countryLayerCanvasRef,
  })

  return (
    <section
      className="relative min-h-0 min-w-0 bg-white min-[56.25rem]:col-start-1 min-[56.25rem]:row-start-2 min-[56.25rem]:row-end-4"
      aria-label="지도 캔버스"
    >
      <div
        className={`scrollbar-custom relative size-full overflow-auto bg-canvas max-[56.25rem]:max-h-[60vh] ${isThreeDimensional ? 'pointer-events-none invisible' : ''}`}
        ref={mapScrollRef}
        aria-hidden={isThreeDimensional}
      >
        <div className="grid min-h-full min-w-full place-items-center">
          <div
            className="flex min-h-px min-w-px"
            style={viewport.mapTrackStyle}
          >
            <WrappedMapTile
              effectiveTool={effectiveTool}
              canvasRef={leftWrappedCanvasRef}
              canvasStyle={viewport.canvasStyle}
              imageRendering={viewport.mapImageRendering}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            />
            <div
              className="relative min-h-px min-w-px flex-none"
              style={viewport.canvasStyle}
            >
              <canvas
                ref={baseCanvasRef}
                className="absolute inset-0 block size-full cursor-crosshair touch-none [image-rendering:pixelated] data-[tool=hand]:cursor-grab data-[tool=hand]:active:cursor-grabbing"
                data-tool={effectiveTool}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                aria-label="프로빈스 백지도"
              />
              <canvas
                ref={waterCanvasRef}
                className="pointer-events-none absolute inset-0 block size-full [image-rendering:pixelated]"
                aria-hidden="true"
              />
              <canvas
                ref={overlayCanvasRef}
                className="pointer-events-none absolute inset-0 z-1 block size-full [image-rendering:pixelated]"
                aria-hidden="true"
              />
              <canvas
                ref={countryLayerCanvasRef}
                className="pointer-events-none absolute inset-0 z-2 block size-full [image-rendering:pixelated]"
                aria-hidden="true"
              />
              {rasterLayers.heightmap ? (
                <>
                  <img
                    ref={heightmapImageRef}
                    className="hidden"
                    src="/maps/base/bmp/heightmap.bmp"
                    alt=""
                    aria-hidden="true"
                    onLoad={handleHeightmapLoad}
                  />
                  <canvas
                    ref={heightmapLayerCanvasRef}
                    className="pointer-events-none absolute inset-0 z-3 block size-full opacity-35 mix-blend-multiply [image-rendering:pixelated]"
                    aria-hidden="true"
                  />
                </>
              ) : null}
              {rasterLayers.rivers ? (
                <>
                  <img
                    ref={riversImageRef}
                    className="hidden"
                    src="/maps/base/bmp/rivers.bmp"
                    alt=""
                    aria-hidden="true"
                    onLoad={handleRiversLoad}
                  />
                  <canvas
                    ref={riversLayerCanvasRef}
                    className="pointer-events-none absolute inset-0 z-4 block size-full mix-blend-multiply [image-rendering:pixelated]"
                    aria-hidden="true"
                  />
                </>
              ) : null}
              <canvas
                ref={borderCanvasRef}
                className="pointer-events-none absolute inset-0 z-5 block size-full [image-rendering:auto]"
                aria-hidden="true"
              />
            </div>
            <WrappedMapTile
              effectiveTool={effectiveTool}
              canvasRef={rightWrappedCanvasRef}
              canvasStyle={viewport.canvasStyle}
              imageRendering={viewport.mapImageRendering}
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

      <canvas ref={mapTextureCanvasRef} className="hidden" aria-hidden="true" />

      {isThreeDimensional ? (
        <Suspense
          fallback={
            <div
              className="absolute inset-0 grid place-items-center bg-slate-950 text-sm font-semibold text-white"
              role="status"
            >
              3D 지도를 준비하는 중입니다.
            </div>
          }
        >
          <ThreeHemisphereMap
            isMapRendering={isMapRendering}
            mapSize={mapSize}
            mapTextureCanvasRef={mapTextureCanvasRef}
            mapTextureUpdateListenerRef={mapTextureUpdateListenerRef}
            onProvinceInspect={onProvinceInspect}
            provinceByRgbRef={provinceByRgbRef}
            sourceImageDataRef={sourceImageDataRef}
          />
        </Suspense>
      ) : null}

      <button
        type="button"
        className="absolute top-4 left-1/2 z-30 flex min-h-8 -translate-x-1/2 items-center gap-1.5 rounded-full border border-black/15 bg-white/90 px-3 text-xs font-semibold text-slate-900 shadow-sm backdrop-blur-sm hover:bg-white"
        aria-label={isThreeDimensional ? '2D 지도로 전환' : '3D 지도로 전환'}
        aria-pressed={isThreeDimensional}
        onClick={() => onViewModeChange(isThreeDimensional ? '2d' : '3d')}
      >
        <Rotate3d aria-hidden="true" size={14} strokeWidth={2} />
        {isThreeDimensional ? '2D 보기' : '3D 보기'}
      </button>

      {!isThreeDimensional ? (
        <>
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
            <button
              type="button"
              aria-label="확대"
              onClick={() => viewport.updateZoom(viewport.zoomRef.current * 1.15)}
            >
              +
            </button>
            <button
              type="button"
              aria-label="축소"
              onClick={() => viewport.updateZoom(viewport.zoomRef.current / 1.15)}
            >
              -
            </button>
          </MapControlGroup>

          <MapToolbar
            effectiveTool={effectiveTool}
            onToolSelect={onToolSelect}
            onPaintModeChange={onPaintModeChange}
            onPaintUnitChange={onPaintUnitChange}
            paintMode={paintMode}
            paintUnit={paintUnit}
          />
        </>
      ) : (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-slate-950/75 px-3 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-sm"
          role="status"
        >
          <Rotate3d aria-hidden="true" size={14} strokeWidth={2} />
          <span className="hidden sm:inline">
            화면 이동 활성화 · 드래그하여 회전 · 클릭하여 Province 확인
          </span>
          <span className="whitespace-nowrap sm:hidden">
            드래그 회전 · 클릭 정보
          </span>
        </div>
      )}
    </section>
  )
}
