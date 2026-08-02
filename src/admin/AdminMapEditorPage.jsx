import { useRef, useState } from 'react'
import { CountryLayerModal } from '../editor/CountryLayerModal'
import { CountryPanel } from '../editor/CountryPanel'
import { MapCanvas } from '../editor/MapCanvas'
import { MapDisplayPanel } from '../editor/MapDisplayPanel'
import { MapEditorPanel } from '../editor/MapEditorPanel'
import { MapExportPanel } from '../editor/MapExportPanel'
import { NumericTypePanel } from '../editor/NumericTypePanel'
import { PowerBlocPanel } from '../editor/PowerBlocPanel'
import { PresetLoader } from '../editor/PresetLoader'
import { ProvinceInfo } from '../editor/ProvinceInfo'
import { useMapEditor } from '../editor/useMapEditor'
import { downloadRenderedMapPng } from '../map/exportMapImage'
import { useMapData } from '../map/useMapData'
import { useMapEditorShortcuts } from './useMapEditorShortcuts'

export function AdminMapEditorPage() {
  const mapScrollRef = useRef(null)
  const [workspaceMode, setWorkspaceMode] = useState('editor')
  const [borderMode, setBorderMode] = useState('state')
  const [rasterLayers, setRasterLayers] = useState({
    heightmap: false,
    rivers: false,
  })
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true)
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true)
  const [isCountryLayerModalOpen, setIsCountryLayerModalOpen] = useState(false)
  const mapData = useMapData(borderMode)
  const editor = useMapEditor({
    mapRenderer: mapData.renderer,
    mapSize: mapData.mapSize,
    mapScrollRef,
    provinceByRgbRef: mapData.provinceByRgbRef,
    selectedPresetPath: mapData.selectedPresetPath,
    setStatus: mapData.setStatus,
    setWorkspaceMode,
    sourceImageDataRef: mapData.sourceImageDataRef,
    stateByProvinceRef: mapData.stateByProvinceRef,
    statesByIdRef: mapData.statesByIdRef,
    workspaceMode,
  })
  const { redo, selectTool, setTemporaryPanActive, undo } = editor
  useMapEditorShortcuts({
    workspaceMode,
    redo,
    undo,
    selectTool,
    setTemporaryPanActive,
  })
  const countryLayerActive =
    editor.countryLayerSettings.selectedIdsByMode[editor.countryLayerSettings.mode]
      ?.length > 0

  function handleRasterLayerChange(layerId, isVisible) {
    setRasterLayers((currentLayers) => ({
      ...currentLayers,
      [layerId]: isVisible,
    }))
  }

  async function handleExportPng() {
    try {
      await downloadRenderedMapPng({
        baseCanvas: mapData.baseCanvasRef.current,
        borderCanvas: mapData.borderCanvasRef.current,
        heightmapVisible: rasterLayers.heightmap,
        overlayCanvas: mapData.overlayCanvasRef.current,
        riversVisible: rasterLayers.rivers,
        countryLayerCanvas: mapData.countryLayerCanvasRef.current,
      })
      mapData.setStatus('원본 해상도 PNG가 저장되었습니다.')
    } catch (error) {
      mapData.setStatus(error.message || 'PNG 저장에 실패했습니다.')
    }
  }

  return (
    <main
      className="relative grid h-screen grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)] max-[56.25rem]:h-auto max-[56.25rem]:min-h-screen min-[56.25rem]:min-w-0 min-[56.25rem]:max-w-full min-[56.25rem]:grid-rows-[auto_minmax(0,1fr)_1.25rem] min-[56.25rem]:overflow-hidden"
    >
      <header className="col-span-full flex items-center py-1">
        <nav className="flex min-h-8 items-center gap-3 justify-between w-full">
          <div>
            <h1 className="sr-only">Province Map Tool</h1>
            <p>{mapData.status}</p>
          </div>
          <ul className="flex gap-3 col">
            <li>
              <button
                type="button"
                aria-pressed={workspaceMode === 'editor'}
                onClick={() => setWorkspaceMode('editor')}
              >
                지도 편집기
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-pressed={workspaceMode === 'loader'}
                onClick={() => setWorkspaceMode('loader')}
              >
                프리셋 불러오기
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <MapEditorPanel
        expanded={isLeftPanelExpanded}
        label="데이터 도구"
        onToggle={() => setIsLeftPanelExpanded((isExpanded) => !isExpanded)}
        side="left"
      >
        {workspaceMode === 'editor' ? (
          <>
            <NumericTypePanel
              heading="Autonomy Types"
              headingId="autonomy-types-title"
              isInUse={(typeId) =>
                Object.keys(editor.autonomyTypes).length <= 1 ||
                Object.values(editor.countries).some(
                  (country) => country.autonomyTypeId === typeId,
                )
              }
              onAdd={editor.addAutonomyType}
              onDelete={editor.deleteAutonomyType}
              onDeleteSelected={editor.deleteAutonomyTypes}
              onUpdate={editor.updateAutonomyType}
              types={editor.autonomyTypes}
              valueKey="autonomy"
              valueLabel="자치도 유형"
            />

            <NumericTypePanel
              heading="Power Ranks"
              headingId="power-ranks-title"
              isInUse={(typeId) =>
                Object.keys(editor.powerRankTypes).length <= 1 ||
                Object.values(editor.countries).some(
                  (country) => country.powerRankTypeId === typeId,
                )
              }
              onAdd={editor.addPowerRankType}
              onDelete={editor.deletePowerRankType}
              onDeleteSelected={editor.deletePowerRankTypes}
              onUpdate={editor.updatePowerRankType}
              types={editor.powerRankTypes}
              valueKey="level"
              valueLabel="국가 등급"
            />

            <PowerBlocPanel
              addPowerBloc={editor.addPowerBloc}
              autonomyTypes={editor.autonomyTypes}
              countries={editor.countries}
              countryOrder={editor.countryOrder}
              deletePowerBloc={editor.deletePowerBloc}
              deletePowerBlocs={editor.deletePowerBlocs}
              powerBlocs={editor.powerBlocs}
              powerRankTypes={editor.powerRankTypes}
              updatePowerBloc={editor.updatePowerBloc}
            />
          </>
        ) : null}
      </MapEditorPanel>

      <MapCanvas
        effectiveTool={editor.effectiveTool}
        baseCanvasRef={mapData.baseCanvasRef}
        borderCanvasRef={mapData.borderCanvasRef}
        canRedo={editor.canRedo}
        canUndo={editor.canUndo}
        isMapRendering={mapData.isMapRendering}
        countryLayerCanvasRef={mapData.countryLayerCanvasRef}
        wrappedMapInvalidationRef={mapData.wrappedMapInvalidationRef}
        mapScrollRef={mapScrollRef}
        mapSize={mapData.mapSize}
        onToolSelect={selectTool}
        onPaintModeChange={editor.setPaintMode}
        onPaintUnitChange={editor.setPaintUnit}
        onPointerDown={editor.handlePointerDown}
        onPointerMove={editor.handlePointerMove}
        onPointerUp={editor.handlePointerUp}
        onRedo={editor.redo}
        onUndo={editor.undo}
        overlayCanvasRef={mapData.overlayCanvasRef}
        paintMode={editor.paintMode}
        paintUnit={editor.paintUnit}
        rasterLayers={rasterLayers}
      />

      <MapEditorPanel
        expanded={isRightPanelExpanded}
        label="국가 및 맵 정보"
        onToggle={() => setIsRightPanelExpanded((isExpanded) => !isExpanded)}
        side="right"
      >
        {workspaceMode === 'editor' ? (
          <>
            <MapDisplayPanel
              borderMode={borderMode}
              onBorderModeChange={setBorderMode}
              countryLayerActive={countryLayerActive}
              onOpenCountryLayer={() => setIsCountryLayerModalOpen(true)}
              onRasterLayerChange={handleRasterLayerChange}
              rasterLayers={rasterLayers}
            />
            <CountryPanel
              activeCountryId={editor.activeCountryId}
              addCountry={editor.addCountry}
              autonomyTypes={editor.autonomyTypes}
              countries={editor.countries}
              countryOrder={editor.countryOrder}
              deleteCountry={editor.deleteCountry}
              powerBlocs={editor.powerBlocs}
              powerRankTypes={editor.powerRankTypes}
              reorderCountries={editor.reorderCountries}
              selectCountry={editor.selectCountry}
              updateCountry={editor.updateCountry}
            />
            <MapExportPanel
              exportPng={handleExportPng}
              pngExportDisabled={!mapData.mapSize || mapData.isMapRendering}
              preset={editor.preset}
            />
          </>
        ) : (
          <PresetLoader
            onLoadPreset={() => editor.loadPreset()}
            onSelectedPresetPathChange={mapData.setSelectedPresetPath}
            presetIndex={mapData.presetIndex}
            selectedPresetPath={mapData.selectedPresetPath}
          />
        )}

        <ProvinceInfo
          isEditor={workspaceMode === 'editor'}
          onUnassignSelectedArea={editor.unassignSelectedArea}
          selectedCountry={editor.selectedCountry}
          selectedProvinceHit={editor.selectedProvinceHit}
          selectedState={editor.selectedState}
        />
      </MapEditorPanel>

      {isCountryLayerModalOpen ? (
        <CountryLayerModal
          autonomyTypes={editor.autonomyTypes}
          countries={editor.countries}
          onClose={() => setIsCountryLayerModalOpen(false)}
          powerBlocs={editor.powerBlocs}
          powerRankTypes={editor.powerRankTypes}
          settings={editor.countryLayerSettings}
          updateCountryLayerSettings={editor.updateCountryLayerSettings}
        />
      ) : null}
    </main>
  )
}
