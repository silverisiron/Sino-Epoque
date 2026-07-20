import { useState } from 'react'
import { CountryPanel } from '../editor/CountryPanel'
import { MapCanvas } from '../editor/MapCanvas'
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

      <MapCanvas
        activeTool={editor.activeTool}
        baseCanvasRef={mapData.baseCanvasRef}
        borderCanvasRef={mapData.borderCanvasRef}
        canvasStyle={viewport.canvasStyle}
        isMapRendering={mapData.isMapRendering}
        mapScrollRef={viewport.mapScrollRef}
        mapSize={mapData.mapSize}
        onActiveToolChange={editor.setActiveTool}
        onOpenSphereLayer={() => setIsSphereLayerModalOpen(true)}
        onPointerDown={editor.handlePointerDown}
        onPointerMove={editor.handlePointerMove}
        onPointerUp={editor.handlePointerUp}
        onZoomIn={() => viewport.updateZoom(viewport.zoomRef.current * 1.15)}
        onZoomOut={() => viewport.updateZoom(viewport.zoomRef.current / 1.15)}
        overlayCanvasRef={mapData.overlayCanvasRef}
        page={page}
        sphereCanvasRef={mapData.sphereCanvasRef}
        sphereLayerActive={
          editor.sphereLayerSettings.selectedTypeIds.some(
            (typeId) => editor.autonomyTypes[typeId]?.autonomy < 10,
          ) &&
          editor.sphereLayerSettings.opacity > 0
        }
        zoom={viewport.zoom}
      />

      <aside className={styles.sidePanel} aria-label="맵 도구">
        {page === 'editor' ? (
          <CountryPanel
            activeCountryId={editor.activeCountryId}
            autonomyTypes={editor.autonomyTypes}
            borderMode={borderMode}
            countries={editor.countries}
            countryOrder={editor.countryOrder}
            onAddAutonomyType={editor.addAutonomyType}
            onAddCountry={editor.addCountry}
            onAutonomyTypeDelete={editor.deleteAutonomyType}
            onAutonomyTypeUpdate={editor.updateAutonomyType}
            onBorderModeChange={setBorderMode}
            onCountryOrderChange={editor.reorderCountries}
            onCountryUpdate={editor.updateCountry}
            onPaintModeChange={editor.setPaintMode}
            onPaintUnitChange={editor.setPaintUnit}
            onSelectCountry={editor.setActiveCountryId}
            paintMode={editor.paintMode}
            paintUnit={editor.paintUnit}
            preset={editor.preset}
          />
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
      </aside>

      {isSphereLayerModalOpen ? (
        <SphereLayerModal
          autonomyTypes={editor.autonomyTypes}
          onApply={editor.applySphereLayerSettings}
          onClose={() => setIsSphereLayerModalOpen(false)}
          settings={editor.sphereLayerSettings}
        />
      ) : null}
    </main>
  )
}
