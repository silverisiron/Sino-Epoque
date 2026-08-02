import { cn } from "../lib/utils";
import { ChoiceInput } from './ChoiceInput';
import { MapDisplayControlGroup } from './MapDisplayControlGroup';
import { PanelSection } from './PanelSection';

export function MapDisplayPanel({
  className,
  borderMode,
  onBorderModeChange,
  onOpenSphereLayer,
  onRasterLayerChange,
  rasterLayers,
  sphereLayerActive,
}) {
  return (
    <PanelSection
      className={cn("grid gap-2.5", className)}
      headingId="map-display-title"
      title="지도 레이어 설정"
    >
      <MapDisplayControlGroup legend="경계선 표시">
        <ChoiceInput
          checked={borderMode === 'province'}
          name="border-mode"
          value="province"
          onChange={() => onBorderModeChange('province')}
        >
          Province
        </ChoiceInput>
        <ChoiceInput
          checked={borderMode === 'state'}
          name="border-mode"
          value="state"
          onChange={() => onBorderModeChange('state')}
        >
          State
        </ChoiceInput>
        <ChoiceInput
          checked={borderMode === 'none'}
          name="border-mode"
          value="none"
          onChange={() => onBorderModeChange('none')}
        >
          없음
        </ChoiceInput>
      </MapDisplayControlGroup>

      <MapDisplayControlGroup legend="기본 지도 레이어">
        <ChoiceInput
          checked={rasterLayers.heightmap}
          name="raster-layer"
          type="checkbox"
          value="heightmap"
          onChange={(event) => onRasterLayerChange('heightmap', event.target.checked)}
        >
          지형 음영
        </ChoiceInput>
        <ChoiceInput
          checked={rasterLayers.rivers}
          name="raster-layer"
          type="checkbox"
          value="rivers"
          onChange={(event) => onRasterLayerChange('rivers', event.target.checked)}
        >
          강
        </ChoiceInput>
      </MapDisplayControlGroup>

      <button
        type="button"
        className="w-full"
        aria-pressed={sphereLayerActive}
        onClick={onOpenSphereLayer}
      >
        국가 레이어 설정
      </button>
    </PanelSection>
  )
}
