import { useEffect, useRef } from 'react'
import { cn } from '../lib/utils'
import { ChoiceInput } from './ChoiceInput'
import { PanelSection } from './PanelSection'

function MapColorControl({ color, label, onChange, shortLabel }) {
  const changeFrameRef = useRef(null)
  const pendingColorRef = useRef(color)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(
    () => () => {
      if (changeFrameRef.current !== null) {
        cancelAnimationFrame(changeFrameRef.current)
      }
    },
    [],
  )

  function handleInput(event) {
    pendingColorRef.current = event.currentTarget.value

    if (changeFrameRef.current !== null) {
      return
    }

    changeFrameRef.current = requestAnimationFrame(() => {
      changeFrameRef.current = null
      onChangeRef.current(pendingColorRef.current)
    })
  }

  return (
    <label
      className="relative flex min-h-6 items-center gap-1 rounded px-1 text-[0.6875rem] text-text-secondary has-focus-visible:outline-2 has-focus-visible:outline-offset-1 has-focus-visible:outline-white"
      title={`${label} 변경`}
    >
      <span>{shortLabel}</span>
      <span
        className="size-3.5 rounded-sm border border-white/50"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <input
        className="absolute inset-0 cursor-pointer opacity-0"
        type="color"
        aria-label={label}
        value={color}
        onInput={handleInput}
      />
    </label>
  )
}

function MapDisplayControlGroup({ actions, children, legend }) {
  return (
    <fieldset className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-y-1.5">
      <legend className="col-start-1 row-start-1">{legend}</legend>
      {actions ? (
        <div className="col-start-2 row-start-1 flex min-w-0 justify-end gap-0.5">
          {actions}
        </div>
      ) : null}
      <div className="col-span-2 row-start-2 flex gap-1.5 *:min-w-0 *:flex-1">
        {children}
      </div>
    </fieldset>
  )
}

export function MapDisplayPanel({
  className,
  borderMode,
  countryLayerActive,
  mapColors,
  onBorderModeChange,
  onMapColorChange,
  onOpenCountryLayer,
  onRasterLayerChange,
  rasterLayers,
}) {
  return (
    <PanelSection
      className={cn('grid gap-2.5', className)}
      headingId="map-display-title"
      title="지도 레이어 설정"
    >
      <MapDisplayControlGroup
        legend="경계선 표시"
        actions={
          <MapColorControl
            color={mapColors.border}
            label="경계선 색상"
            shortLabel="선"
            onChange={(color) => onMapColorChange('border', color)}
          />
        }
      >
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

      <MapDisplayControlGroup
        legend="기본 지도 레이어"
        actions={
          <>
            <MapColorControl
              color={mapColors.water}
              label="바다 색상"
              shortLabel="바다"
              onChange={(color) => onMapColorChange('water', color)}
            />
            <MapColorControl
              color={mapColors.land}
              label="미할당 지역 색상"
              shortLabel="빈 땅"
              onChange={(color) => onMapColorChange('land', color)}
            />
            <MapColorControl
              color={mapColors.heightmap}
              label="지형 음영 색상"
              shortLabel="음영"
              onChange={(color) => onMapColorChange('heightmap', color)}
            />
            <MapColorControl
              color={mapColors.rivers}
              label="강 색상"
              shortLabel="강"
              onChange={(color) => onMapColorChange('rivers', color)}
            />
          </>
        }
      >
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
        aria-pressed={countryLayerActive}
        onClick={onOpenCountryLayer}
      >
        국가 레이어 설정
      </button>
    </PanelSection>
  )
}
