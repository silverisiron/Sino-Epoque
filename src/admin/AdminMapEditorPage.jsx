import { useEffect, useState } from 'react'
import { CountryPanel } from '../editor/CountryPanel'
import { DataManagerPanel } from '../editor/DataManagerPanel'
import { MapCanvas } from '../editor/MapCanvas'
import { MapDisplayPanel } from '../editor/MapDisplayPanel'
import { MapEditorPanel } from '../editor/MapEditorPanel'
import { PresetLoader } from '../editor/PresetLoader'
import { ProvinceInfo } from '../editor/ProvinceInfo'
import { SphereLayerModal } from '../editor/SphereLayerModal'
import { useMapEditor } from '../editor/useMapEditor'
import { downloadRenderedMapPng } from '../map/exportMapImage'
import { useMapData } from '../map/useMapData'
import { useMapViewport } from '../map/useMapViewport'

const MAP_TOOL_SHORTCUTS = {
  KeyQ: 'paint',
  KeyW: 'eyedropper',
  KeyE: 'erase',
  KeyR: 'hand',
}

function blocksMapToolShortcut(target) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target?.isContentEditable ||
    target?.closest?.('[role="dialog"]')
  )
}

export function AdminMapEditorPage() {
  const [page, setPage] = useState('editor')
  const [borderMode, setBorderMode] = useState('state')
  const [rasterLayers, setRasterLayers] = useState({
    heightmap: false,
    rivers: false,
  })
  const [isLeftPanelExpanded, setIsLeftPanelExpanded] = useState(true)
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(true)
  const [isSphereLayerModalOpen, setIsSphereLayerModalOpen] = useState(false)
  const mapData = useMapData(borderMode)
  const viewport = useMapViewport(mapData.mapSize)
  const editor = useMapEditor({
    activePage: page,
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
    syncWrappedMap: mapData.syncWrappedMap,
  })
  const { redo, setActiveTool, setTemporaryPanActive, undo } = editor
  const sphereLayerActive =
    editor.sphereLayerSettings.selectedIdsByMode[editor.sphereLayerSettings.mode]?.length > 0

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
        sphereCanvas: mapData.sphereCanvasRef.current,
      })
      mapData.setStatus('원본 해상도 PNG가 저장되었습니다.')
    } catch (error) {
      mapData.setStatus(error.message || 'PNG 저장에 실패했습니다.')
    }
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

  useEffect(() => {
    function handleToolShortcut(event) {
      if (event.key === 'Alt') {
        if (
          page === 'editor' &&
          !event.repeat &&
          !blocksMapToolShortcut(event.target)
        ) {
          event.preventDefault()
          setTemporaryPanActive(true)
        }

        return
      }

      const nextTool = MAP_TOOL_SHORTCUTS[event.code]

      if (
        page !== 'editor' ||
        !nextTool ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        blocksMapToolShortcut(event.target)
      ) {
        return
      }

      event.preventDefault()
      setActiveTool(nextTool)
    }

    function releaseTemporaryPan(event) {
      if (!event || event.type !== 'keyup' || event.key === 'Alt') {
        setTemporaryPanActive(false)
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        releaseTemporaryPan()
      }
    }

    window.addEventListener('keydown', handleToolShortcut)
    window.addEventListener('keyup', releaseTemporaryPan)
    window.addEventListener('blur', releaseTemporaryPan)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('keydown', handleToolShortcut)
      window.removeEventListener('keyup', releaseTemporaryPan)
      window.removeEventListener('blur', releaseTemporaryPan)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      setTemporaryPanActive(false)
    }
  }, [page, setActiveTool, setTemporaryPanActive])

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
            <li><button type="button" aria-pressed={page === 'editor'} onClick={() => setPage('editor')}>
            지도 편집기
          </button></li>
            <li><button type="button" aria-pressed={page === 'loader'} onClick={() => setPage('loader')}>
            프리셋 불러오기
          </button></li>
          </ul>
        </nav>
      </header>

      <MapEditorPanel
        expanded={isLeftPanelExpanded}
        label="데이터 도구"
        onToggle={() => setIsLeftPanelExpanded((isExpanded) => !isExpanded)}
        side="left"
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
            onAutonomyTypesDelete={editor.deleteAutonomyTypes}
            onAutonomyTypeUpdate={editor.updateAutonomyType}
            onPowerBlocDelete={editor.deletePowerBloc}
            onPowerBlocsDelete={editor.deletePowerBlocs}
            onPowerBlocUpdate={editor.updatePowerBloc}
            onPowerRankTypeDelete={editor.deletePowerRankType}
            onPowerRankTypesDelete={editor.deletePowerRankTypes}
            onPowerRankTypeUpdate={editor.updatePowerRankType}
            powerBlocs={editor.powerBlocs}
            powerRankTypes={editor.powerRankTypes}
          />
        ) : null}
      </MapEditorPanel>

      <MapCanvas
        activeTool={editor.activeTool}
        baseCanvasRef={mapData.baseCanvasRef}
        borderCanvasRef={mapData.borderCanvasRef}
        canvasStyle={viewport.canvasStyle}
        canRedo={editor.canRedo}
        canUndo={editor.canUndo}
        isMapRendering={mapData.isMapRendering}
        mapImageRendering={viewport.mapImageRendering}
        mapRenderSyncRef={mapData.mapRenderSyncRef}
        mapScrollRef={viewport.mapScrollRef}
        mapTrackStyle={viewport.mapTrackStyle}
        onActiveToolChange={setActiveTool}
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

      <MapEditorPanel
        expanded={isRightPanelExpanded}
        label="국가 및 맵 정보"
        onToggle={() => setIsRightPanelExpanded((isExpanded) => !isExpanded)}
        side="right"
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
            onCountryDelete={editor.deleteCountry}
              onCountryOrderChange={editor.reorderCountries}
              onCountryUpdate={editor.updateCountry}
              onExportPng={handleExportPng}
              onSelectCountry={editor.setActiveCountryId}
              pngExportDisabled={!mapData.mapSize || mapData.isMapRendering}
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
      </MapEditorPanel>

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
