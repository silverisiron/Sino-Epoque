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
import styles from './AdminMapEditorPage.module.css'

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
    <main className={styles.appShell}>
      <header className={styles.appHeader}>
        <div>
          <h1>Province Map Tool</h1>
          <p>{mapData.status}</p>
        </div>
        <nav aria-label="페이지">
          <button type="button" aria-pressed={page === 'editor'} onClick={() => setPage('editor')}>
            지도 편집기
          </button>
          <button type="button" aria-pressed={page === 'loader'} onClick={() => setPage('loader')}>
            프리셋 불러오기
          </button>
        </nav>
      </header>

      <section className={styles.sidePanel} aria-label="데이터 도구">
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

      <section className={styles.sidePanel} aria-label="국가 및 맵 정보">
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
