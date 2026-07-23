import styles from '../admin/AdminMapEditorPage.module.css'
import { PanelHeader } from './PanelHeader'

export function MapDisplayPanel({
  borderMode,
  onBorderModeChange,
  onOpenSphereLayer,
  sphereLayerActive,
}) {
  return (
    <section className={styles.mapDisplayPanel} aria-labelledby="map-display-title">
      <PanelHeader headingId="map-display-title" title="Map Display" />

      <div className={styles.mapDisplayControls} role="group" aria-label="경계선 표시">
        <button
          type="button"
          aria-pressed={borderMode === 'province'}
          onClick={() => onBorderModeChange('province')}
        >
          Province
        </button>
        <button
          type="button"
          aria-pressed={borderMode === 'state'}
          onClick={() => onBorderModeChange('state')}
        >
          State
        </button>
        <button
          type="button"
          aria-pressed={borderMode === 'none'}
          onClick={() => onBorderModeChange('none')}
        >
          없음
        </button>
      </div>

      <button
        type="button"
        className={styles.mapLayerButton}
        aria-pressed={sphereLayerActive}
        onClick={onOpenSphereLayer}
      >
        지도 레이어 설정
      </button>
    </section>
  )
}
