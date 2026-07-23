import styles from '../admin/AdminMapEditorPage.module.css'
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
      className={`${styles.mapPanel} border border-[#d5dbe3] bg-white`}
      aria-label="지도 캔버스"
    >
      <div className={`${styles.mapScroll} bg-[#e6ebf1]`} ref={mapScrollRef}>
        <div className={styles.mapStage}>
          <div className={styles.canvasStack} style={canvasStyle}>
            <canvas
              ref={baseCanvasRef}
              className={styles.provinceMap}
              data-tool={activeTool}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label="프로빈스 백지도"
            />
            <canvas ref={overlayCanvasRef} className={styles.provinceOverlay} aria-hidden="true" />
            <canvas ref={sphereCanvasRef} className={styles.sphereOverlay} aria-hidden="true" />
            {rasterLayers.heightmap ? (
              <img
                className={`${styles.mapRasterLayer} ${styles.heightmapLayer}`}
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
                className={`${styles.mapRasterLayer} ${styles.riversLayer}`}
                src="/maps/base/bmp/rivers.bmp"
                width="5632"
                height="2048"
                alt=""
                aria-hidden="true"
                draggable="false"
              />
            ) : null}
            <canvas ref={borderCanvasRef} className={styles.provinceBorder} aria-hidden="true" />
          </div>
        </div>
        {isMapRendering ? (
          <div className={styles.mapLoading}>
            <div
              className="flex items-center gap-2.5 border border-[#aeb7c2] bg-white px-3.5 py-2.5 text-sm font-semibold"
              role="status"
              aria-live="polite"
            >
              <span className={styles.throbber} aria-hidden="true" />
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
