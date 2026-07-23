import { MapDisplayControlGroup } from './MapDisplayControlGroup'
import { PanelHeader } from './PanelHeader'

export function MapDisplayPanel({
  borderMode,
  onBorderModeChange,
  onOpenSphereLayer,
  onRasterLayerChange,
  rasterLayers,
  sphereLayerActive,
}) {
  return (
    <section
      className="grid gap-2.5 border-b border-[#d5dbe3] pb-3"
      aria-labelledby="map-display-title"
    >
      <PanelHeader headingId="map-display-title" title="Map Display" />

      <MapDisplayControlGroup legend="경계선 표시">
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
      </MapDisplayControlGroup>

      <MapDisplayControlGroup legend="기본 지도 레이어">
        <button
          type="button"
          aria-pressed={rasterLayers.heightmap}
          onClick={() => onRasterLayerChange('heightmap', !rasterLayers.heightmap)}
        >
          지형 음영
        </button>
        <button
          type="button"
          aria-pressed={rasterLayers.rivers}
          onClick={() => onRasterLayerChange('rivers', !rasterLayers.rivers)}
        >
          강
        </button>
      </MapDisplayControlGroup>

      <button
        type="button"
        className="w-full"
        aria-pressed={sphereLayerActive}
        onClick={onOpenSphereLayer}
      >
        국가 레이어 설정
      </button>
    </section>
  )
}
