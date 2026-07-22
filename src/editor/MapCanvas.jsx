import styles from '../admin/AdminMapEditorPage.module.css'
import { MapToolbar } from './MapToolbar'

export function MapCanvas({
  activeTool,
  baseCanvasRef,
  borderCanvasRef,
  borderMode,
  canRedo,
  canUndo,
  canvasStyle,
  isMapRendering,
  mapScrollRef,
  onActiveToolChange,
  onBorderModeChange,
  onOpenSphereLayer,
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
  sphereCanvasRef,
  sphereLayerActive,
}) {
  return (
    <section className={styles.mapPanel} aria-label="지도 캔버스">
      <div className={styles.mapScroll} ref={mapScrollRef}>
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
            <canvas ref={borderCanvasRef} className={styles.provinceBorder} aria-hidden="true" />
          </div>
        </div>
        {isMapRendering ? (
          <div className={styles.mapLoading}>
            <div className={styles.loadingContent} role="status" aria-live="polite">
              <span className={styles.throbber} aria-hidden="true" />
              <span>로딩중...</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className={styles.mapHistoryTools} role="toolbar" aria-label="편집 기록">
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
      </div>

      <MapToolbar
        activeTool={activeTool}
        borderMode={borderMode}
        onActiveToolChange={onActiveToolChange}
        onBorderModeChange={onBorderModeChange}
        onOpenSphereLayer={onOpenSphereLayer}
        onPaintModeChange={onPaintModeChange}
        onPaintUnitChange={onPaintUnitChange}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        paintMode={paintMode}
        paintUnit={paintUnit}
        sphereLayerActive={sphereLayerActive}
      />
    </section>
  )
}
