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
    <section className="map-panel" aria-labelledby="map-title">
      <div className="panel-header">
        <div>
          <h2 id="map-title">{page === 'editor' ? 'Map Editor' : 'Preset Loader'}</h2>
          <p>
            {mapSize ? `${mapSize.width} x ${mapSize.height}` : '-'} / zoom{' '}
            {Math.round(zoom * 100)}%
          </p>
        </div>
        <div className="map-tools" aria-label="지도 도구">
          <div className="tool-group" role="group" aria-label="도구">
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
          <div className="zoom-buttons" role="group" aria-label="확대 축소">
            <button type="button" onClick={onZoomIn}>
              +
            </button>
            <button type="button" onClick={onZoomOut}>
              -
            </button>
          </div>
        </div>
      </div>

      <div className="map-scroll" ref={mapScrollRef}>
        <div className="map-stage">
          <div className="canvas-stack" style={canvasStyle}>
            <canvas
              ref={baseCanvasRef}
              className="province-map"
              data-tool={activeTool}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-label="프로빈스 백지도"
            />
            <canvas ref={overlayCanvasRef} className="province-overlay" aria-hidden="true" />
            <canvas ref={borderCanvasRef} className="province-border" aria-hidden="true" />
          </div>
        </div>
        {isMapRendering ? (
          <div className="map-loading" role="status" aria-live="polite">
            <span className="throbber" aria-hidden="true" />
            <span>로딩중...</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
