import { useEffect, useState } from 'react'
import { CountryPanel } from '../editor/CountryPanel'
import { DataManagerPanel } from '../editor/DataManagerPanel'
import { MapCanvas } from '../editor/MapCanvas'
import { MapDisplayPanel } from '../editor/MapDisplayPanel'
import { PresetLoader } from '../editor/PresetLoader'
import { ProvinceInfo } from '../editor/ProvinceInfo'
import { SphereLayerModal } from '../editor/SphereLayerModal'
import { useMapEditor } from '../editor/useMapEditor'
import { useMapData } from '../map/useMapData'
import { useMapViewport } from '../map/useMapViewport'

export function AdminMapEditorPage() {
  const [page, setPage] = useState('editor')
  const [borderMode, setBorderMode] = useState('state')
  const [rasterLayers, setRasterLayers] = useState({
    heightmap: false,
    rivers: false,
  })
  const [isSphereLayerModalOpen, setIsSphereLayerModalOpen] = useState(false)
  const mapData = useMapData(borderMode)
  const viewport = useMapViewport(mapData.mapSize)
  const editor = useMapEditor({
    activePage: page,
    baseCanvasRef: mapData.baseCanvasRef,
    mapSize: mapData.mapSize,
    mapScrollRef: viewport.mapScrollRef,
    overlayCanvasRef: mapData.overlayCanvasRef,
    overlayImageDataRef: mapData.overlayImageDataRef,
    provinceByRgbRef: mapData.provinceByRgbRef,
    provincePixelCacheRef: mapData.provincePixelCacheRef,
    redrawAllOverlay: mapData.redrawAllOverlay,
    redrawSphereLayer: mapData.redrawSphereLayer,
    selectedPresetPath: mapData.selectedPresetPath,
    setActivePage: setPage,
    setStatus: mapData.setStatus,
    sourceImageDataRef: mapData.sourceImageDataRef,
    sphereCanvasRef: mapData.sphereCanvasRef,
    sphereImageDataRef: mapData.sphereImageDataRef,
    stateByProvinceRef: mapData.stateByProvinceRef,
    statesByIdRef: mapData.statesByIdRef,
  })
  const { redo, undo } = editor
  const sphereLayerActive =
    editor.sphereLayerSettings.selectedIdsByMode[editor.sphereLayerSettings.mode]?.length > 0

  function handleRasterLayerChange(layerId, isVisible) {
    setRasterLayers((currentLayers) => ({
      ...currentLayers,
      [layerId]: isVisible,
    }))
  }

  useEffect(() => {
    function handleHistoryShortcut(event) {
      const target = event.target

      if (
        event.defaultPrevented ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return
      }

      const key = event.key.toLowerCase()

      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleHistoryShortcut)
    return () => window.removeEventListener('keydown', handleHistoryShortcut)
  }, [redo, undo])

  return (
    <main className="grid h-screen grid-cols-[320px_minmax(0,1fr)_320px] grid-rows-[auto_minmax(0,1fr)] gap-3 bg-[#f4f5f7] p-3 text-[#17202a] [&_button]:min-h-8 [&_button]:border [&_button]:border-[#aeb7c2] [&_button]:bg-white [&_button]:text-sm [&_button[aria-pressed=true]]:bg-[#17202a] [&_button[aria-pressed=true]]:text-white [&_dd]:text-sm [&_dd]:font-semibold [&_dl]:m-0 [&_dt]:text-sm [&_dt]:text-[#667085] [&_h1]:m-0 [&_h1]:text-xl [&_h2]:m-0 [&_h2]:text-base [&_input]:min-h-8 [&_input]:text-sm [&_label]:grid [&_label]:gap-1.5 [&_label]:text-sm [&_p]:m-0 [&_p]:text-sm [&_select]:min-h-8 [&_select]:text-sm max-[900px]:h-auto max-[900px]:min-h-screen max-[900px]:grid-cols-1">
      <header className="col-span-full flex items-center justify-between gap-4 border border-[#d5dbe3] bg-white p-3">
        <div>
          <h1>Province Map Tool</h1>
          <p>{mapData.status}</p>
        </div>
        <nav className="flex min-h-8 items-center justify-between gap-3" aria-label="페이지">
          <button type="button" aria-pressed={page === 'editor'} onClick={() => setPage('editor')}>
            지도 편집기
          </button>
          <button type="button" aria-pressed={page === 'loader'} onClick={() => setPage('loader')}>
            프리셋 불러오기
          </button>
        </nav>
      </header>

      <section
        className="grid min-h-0 content-start gap-4.5 overflow-y-auto overscroll-contain border border-[#d5dbe3] bg-white p-3 max-[900px]:overflow-y-visible"
        aria-label="데이터 도구"
      >
        {page === 'editor' ? (
          <DataManagerPanel
            autonomyTypes={editor.autonomyTypes}
            countries={editor.countries}
            countryOrder={editor.countryOrder}
            onAddAutonomyType={editor.addAutonomyType}
            onAddPowerBloc={editor.addPowerBloc}
            onAddPowerRankType={editor.addPowerRankType}
            onAutonomyTypeDelete={editor.deleteAutonomyType}
            onAutonomyTypeUpdate={editor.updateAutonomyType}
            onPowerBlocDelete={editor.deletePowerBloc}
            onPowerBlocUpdate={editor.updatePowerBloc}
            onPowerRankTypeDelete={editor.deletePowerRankType}
            onPowerRankTypeUpdate={editor.updatePowerRankType}
            powerBlocs={editor.powerBlocs}
            powerRankTypes={editor.powerRankTypes}
          />
        ) : null}
      </section>

      <MapCanvas
        activeTool={editor.activeTool}
        baseCanvasRef={mapData.baseCanvasRef}
        borderCanvasRef={mapData.borderCanvasRef}
        canvasStyle={viewport.canvasStyle}
        canRedo={editor.canRedo}
        canUndo={editor.canUndo}
        isMapRendering={mapData.isMapRendering}
        mapScrollRef={viewport.mapScrollRef}
        onActiveToolChange={editor.setActiveTool}
        onPaintModeChange={editor.setPaintMode}
        onPaintUnitChange={editor.setPaintUnit}
        onPointerDown={editor.handlePointerDown}
        onPointerMove={editor.handlePointerMove}
        onPointerUp={editor.handlePointerUp}
        onRedo={editor.redo}
        onUndo={editor.undo}
        onZoomIn={() => viewport.updateZoom(viewport.zoomRef.current * 1.15)}
        onZoomOut={() => viewport.updateZoom(viewport.zoomRef.current / 1.15)}
        overlayCanvasRef={mapData.overlayCanvasRef}
        paintMode={editor.paintMode}
        paintUnit={editor.paintUnit}
        rasterLayers={rasterLayers}
        sphereCanvasRef={mapData.sphereCanvasRef}
      />

      <section
        className="grid min-h-0 content-start gap-4.5 overflow-y-auto overscroll-contain border border-[#d5dbe3] bg-white p-3 max-[900px]:overflow-y-visible"
        aria-label="국가 및 맵 정보"
      >
        {page === 'editor' ? (
          <>
            <MapDisplayPanel
              borderMode={borderMode}
              onBorderModeChange={setBorderMode}
              onOpenSphereLayer={() => setIsSphereLayerModalOpen(true)}
              onRasterLayerChange={handleRasterLayerChange}
              rasterLayers={rasterLayers}
              sphereLayerActive={sphereLayerActive}
            />
            <CountryPanel
              activeCountryId={editor.activeCountryId}
              autonomyTypes={editor.autonomyTypes}
              countries={editor.countries}
              countryOrder={editor.countryOrder}
              onAddCountry={editor.addCountry}
              onCountryOrderChange={editor.reorderCountries}
              onCountryUpdate={editor.updateCountry}
              onSelectCountry={editor.setActiveCountryId}
              powerBlocs={editor.powerBlocs}
              powerRankTypes={editor.powerRankTypes}
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
          isEditor={page === 'editor'}
          onRemoveAssignment={editor.removeAssignment}
          selectedCountry={editor.selectedCountry}
          selectedProvince={editor.selectedProvince}
          selectedState={editor.selectedState}
        />
      </section>

      {isSphereLayerModalOpen ? (
        <SphereLayerModal
          autonomyTypes={editor.autonomyTypes}
          countries={editor.countries}
          onApply={editor.applySphereLayerSettings}
          onClose={() => setIsSphereLayerModalOpen(false)}
          powerBlocs={editor.powerBlocs}
          powerRankTypes={editor.powerRankTypes}
          settings={editor.sphereLayerSettings}
        />
      ) : null}
    </main>
  )
}
