import styles from '../admin/AdminMapEditorPage.module.css'

export function MapToolbar({
  activeTool,
  borderMode,
  onActiveToolChange,
  onBorderModeChange,
  onOpenSphereLayer,
  onPaintModeChange,
  onPaintUnitChange,
  onZoomIn,
  onZoomOut,
  paintMode,
  paintUnit,
  sphereLayerActive,
}) {
  return (
    <ul className={styles.mapToolbar} role="toolbar" aria-label="지도 도구">
      <li className={styles.toolbarItem}>
        <button
          type="button"
          aria-pressed={activeTool === 'paint'}
          onClick={() => onActiveToolChange('paint')}
        >
          그리기
        </button>
        <details className={styles.toolbarMenu}>
          <summary aria-label="그리기 설정">▽</summary>
          <div className={styles.toolbarMenuContent}>
            <div className={styles.paintModes} role="group" aria-label="페인트 모드">
              <button
                type="button"
                aria-pressed={paintMode === 'single'}
                onClick={() => onPaintModeChange('single')}
              >
                단일 채우기
              </button>
              <button
                type="button"
                aria-pressed={paintMode === 'multi'}
                onClick={() => onPaintModeChange('multi')}
              >
                다중 채우기
              </button>
            </div>

            <div className={styles.paintModes} role="group" aria-label="색칠 단위">
              <button
                type="button"
                aria-pressed={paintUnit === 'province'}
                onClick={() => onPaintUnitChange('province')}
              >
                Province 별 색칠
              </button>
              <button
                type="button"
                aria-pressed={paintUnit === 'state'}
                onClick={() => onPaintUnitChange('state')}
              >
                State 별 색칠
              </button>
            </div>
          </div>
        </details>
      </li>

      <li>
        <button
          type="button"
          aria-pressed={activeTool === 'erase'}
          onClick={() => onActiveToolChange('erase')}
        >
          지우개
        </button>
      </li>

      <li>
        <button
          type="button"
          aria-pressed={activeTool === 'hand'}
          onClick={() => onActiveToolChange('hand')}
        >
          화면 이동
        </button>
      </li>

      <li className={styles.toolbarItem}>
        <button
          type="button"
          aria-pressed={sphereLayerActive}
          onClick={onOpenSphereLayer}
        >
          레이어
        </button>
        <details className={styles.toolbarMenu}>
          <summary aria-label="국경선 설정">▽</summary>
          <div className={styles.toolbarMenuContent}>
            <div className={styles.paintModes} role="group" aria-label="경계선 표시">
              <button
                type="button"
                aria-pressed={borderMode === 'province'}
                onClick={() => onBorderModeChange('province')}
              >
                Province 국경
              </button>
              <button
                type="button"
                aria-pressed={borderMode === 'state'}
                onClick={() => onBorderModeChange('state')}
              >
                State 국경
              </button>
              <button
                type="button"
                aria-pressed={borderMode === 'none'}
                onClick={() => onBorderModeChange('none')}
              >
                국경 표시 없음
              </button>
            </div>
          </div>
        </details>
      </li>

      <li className={styles.zoomButtons} aria-label="확대 축소">
        <button type="button" aria-label="확대" onClick={onZoomIn}>
          +
        </button>
        <button type="button" aria-label="축소" onClick={onZoomOut}>
          -
        </button>
      </li>
    </ul>
  )
}
