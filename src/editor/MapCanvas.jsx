import { MapControlGroup } from './MapControlGroup'
import { MapToolbar } from './MapToolbar'

export function MapCanvas({
  activeTool,
  baseCanvasRef,
  borderCanvasRef,
  canRedo,
  canUndo,
  canvasStyle,
  isMapRendering,
  mapScrollRef,
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
          <div className="relative min-h-px min-w-px" style={canvasStyle}>
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
                className="pointer-events-none absolute inset-0 z-3lock size-full object-fill opacity-35 mix-blend-multiply [image-rendering:pixelated]"
                src="/maps/base/bmp/heightmap.bmp"
                width="5632"
                height="2048"
                alt=""
                aria-hidden="true"
                draggable="false"
              />
            ) : null}
            {rasterLayers.rivers ? (
              <img
                className="pointer-events-none absolute inset-0 z-4 block size-full object-fill mix-blend-multiply [image-rendering:pixelated]"
                src="/maps/base/bmp/rivers.bmp"
                width="5632"
                height="2048"
                alt=""
                aria-hidden="true"
                draggable="false"
              />
            ) : null}
            <canvas
              ref={borderCanvasRef}
              className="pointer-events-none absolute inset-0 z-5 block size-full [image-rendering:pixelated]"
              aria-hidden="true"
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
