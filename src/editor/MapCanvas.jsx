import styles from '../admin/AdminMapEditorPage.module.css'

export function MapCanvas({
  activeTool,
  baseCanvasRef,
  borderCanvasRef,
  canvasStyle,
  isMapRendering,
  mapScrollRef,
  mapSize,
  onActiveToolChange,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onZoomIn,
  onZoomOut,
  overlayCanvasRef,
  page,
  zoom,
}) {
  return (
    <section className={styles.mapPanel} aria-labelledby="map-title">
      <div className={styles.panelHeader}>
        <div>
          <h2 id="map-title">{page === 'editor' ? 'Map Editor' : 'Preset Loader'}</h2>
          <p>
            {mapSize ? `${mapSize.width} x ${mapSize.height}` : '-'} / zoom{' '}
            {Math.round(zoom * 100)}%
          </p>
        </div>
        <div className={styles.mapTools} aria-label="지도 도구">
          <div className={styles.toolGroup} role="group" aria-label="도구">
            <button
              type="button"
              aria-pressed={activeTool === 'paint'}
              onClick={() => onActiveToolChange('paint')}
            >
              그리기
            </button>
            <button
              type="button"
              aria-pressed={activeTool === 'hand'}
              onClick={() => onActiveToolChange('hand')}
            >
              화면 이동
            </button>
          </div>
          <div className={styles.zoomButtons} role="group" aria-label="확대 축소">
            <button type="button" onClick={onZoomIn}>
              +
            </button>
            <button type="button" onClick={onZoomOut}>
              -
            </button>
          </div>
        </div>
      </div>

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
    </section>
  )
}
