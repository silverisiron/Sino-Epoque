import { useRef, useState } from 'react'
import { isWater } from '../map/provinceData'
import {
  updateProvinceAssignments,
  wouldChangeProvinceAssignments,
} from './model/provinceAssignmentOperations'

export function useMapInteraction({
  commitEditorState,
  countryLayerSettingsRef,
  editorStateRef,
  mapRenderer,
  mapScrollRef,
  provinceByRgbRef,
  recordHistoryCheckpoint,
  selectCountry,
  setStatus,
  sourceImageDataRef,
  stateByProvinceRef,
  statesByIdRef,
  workspaceMode,
}) {
  const historyTransactionRef = useRef(false)
  const isPaintingRef = useRef(false)
  const lastPaintedProvinceIdRef = useRef(null)
  const panRef = useRef(null)
  const [selectedTool, setSelectedTool] = useState('paint')
  const [isTemporaryPanActive, setTemporaryPanActive] = useState(false)
  const [paintMode, setPaintMode] = useState('multi')
  const [paintUnit, setPaintUnit] = useState('state')
  const [selectedProvinceHit, setSelectedProvinceHit] = useState(null)
  const [selectedState, setSelectedState] = useState(null)

  const effectiveTool = isTemporaryPanActive ? 'hand' : selectedTool

  function getProvinceHitFromPointer(event) {
    const sourceImageData = sourceImageDataRef.current

    if (!sourceImageData) {
      return null
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = Math.floor(
      ((event.clientX - rect.left) / rect.width) * sourceImageData.width,
    )
    const y = Math.floor(
      ((event.clientY - rect.top) / rect.height) * sourceImageData.height,
    )

    if (
      x < 0 ||
      x >= sourceImageData.width ||
      y < 0 ||
      y >= sourceImageData.height
    ) {
      return null
    }

    const pixelIndex = (y * sourceImageData.width + x) * 4
    const data = sourceImageData.data
    const rgb = `${data[pixelIndex]},${data[pixelIndex + 1]},${data[pixelIndex + 2]}`

    return {
      province: provinceByRgbRef.current.get(rgb),
      rgb,
      x,
      y,
    }
  }

  function getProvinceState(province) {
    const stateId = stateByProvinceRef.current.get(province.id)
    return stateId ? statesByIdRef.current.get(stateId) ?? null : null
  }

  function getPaintTargetProvinces(province, provinceState) {
    return paintUnit === 'state' && provinceState
      ? provinceState.provinces.filter((stateProvince) => !isWater(stateProvince))
      : [province]
  }

  function renderProvinceAssignmentPatch(provinces, countryId, editorState) {
    mapRenderer.renderProvinceAssignmentPatch({
      provinces,
      countryId,
      countries: editorState.countries,
      autonomyTypes: editorState.autonomyTypes,
      powerRankTypes: editorState.powerRankTypes,
      powerBlocs: editorState.powerBlocs,
      settings: countryLayerSettingsRef.current,
    })
  }

  function applyToolAtProvinceHit(provinceHit) {
    const province = provinceHit?.province

    if (
      !province ||
      lastPaintedProvinceIdRef.current === province.id
    ) {
      return
    }

    setSelectedProvinceHit(provinceHit)
    lastPaintedProvinceIdRef.current = province.id

    const provinceState = getProvinceState(province)
    setSelectedState(provinceState)

    if (
      workspaceMode !== 'editor' ||
      effectiveTool === 'hand' ||
      isWater(province)
    ) {
      return
    }

    const editorState = editorStateRef.current

    if (effectiveTool === 'eyedropper') {
      const sampledCountryId = editorState.provinceAssignments[province.id]
      const sampledCountry = editorState.countries[sampledCountryId]

      if (sampledCountry) {
        selectCountry(sampledCountryId)
        setSelectedTool('paint')
        setStatus(`${sampledCountry.name} 선택`)
      }

      return
    }

    const activeCountry = editorState.countries[editorState.activeCountryId]

    if (effectiveTool === 'paint' && !activeCountry) {
      return
    }

    const targetProvinces = getPaintTargetProvinces(province, provinceState)
    const assignedCountryId =
      effectiveTool === 'erase' ? null : editorState.activeCountryId

    if (
      !wouldChangeProvinceAssignments(
        editorState.provinceAssignments,
        targetProvinces,
        assignedCountryId,
      )
    ) {
      return
    }

    if (paintMode === 'multi') {
      if (!historyTransactionRef.current) {
        recordHistoryCheckpoint()
        historyTransactionRef.current = true
      }
    }

    const nextEditorState = updateProvinceAssignments(
      editorState,
      targetProvinces,
      assignedCountryId,
    )
    commitEditorState(nextEditorState, {
      recordHistory: paintMode !== 'multi',
    })
    renderProvinceAssignmentPatch(
      targetProvinces,
      assignedCountryId,
      nextEditorState,
    )
  }

  function handlePointerDown(event) {
    if (event.button !== 0) {
      return
    }

    const provinceHit = getProvinceHitFromPointer(event)

    if (effectiveTool === 'hand') {
      panRef.current = {
        pointerId: event.pointerId,
        lastX: event.clientX,
        lastY: event.clientY,
      }
      event.currentTarget.setPointerCapture(event.pointerId)
      return
    }

    if (paintMode === 'multi' && effectiveTool !== 'eyedropper') {
      isPaintingRef.current = true
      lastPaintedProvinceIdRef.current = null
      event.currentTarget.setPointerCapture(event.pointerId)
    }

    applyToolAtProvinceHit(provinceHit)
  }

  function finishPointerInteraction(pointerId) {
    if (panRef.current?.pointerId === pointerId) {
      panRef.current = null
    }

    isPaintingRef.current = false
    lastPaintedProvinceIdRef.current = null
    historyTransactionRef.current = false
  }

  function handlePointerMove(event) {
    if (
      (isPaintingRef.current || panRef.current?.pointerId === event.pointerId) &&
      (event.buttons & 1) === 0
    ) {
      finishPointerInteraction(event.pointerId)
      return
    }

    if (effectiveTool === 'hand' && panRef.current) {
      const scrollContainer = mapScrollRef.current

      if (!scrollContainer) {
        return
      }

      scrollContainer.scrollLeft -= event.clientX - panRef.current.lastX
      scrollContainer.scrollTop -= event.clientY - panRef.current.lastY
      panRef.current.lastX = event.clientX
      panRef.current.lastY = event.clientY
      return
    }

    if (
      effectiveTool !== 'hand' &&
      effectiveTool !== 'eyedropper' &&
      paintMode === 'multi' &&
      isPaintingRef.current
    ) {
      applyToolAtProvinceHit(getProvinceHitFromPointer(event))
    }
  }

  function handlePointerUp(event) {
    finishPointerInteraction(event.pointerId)
  }

  function unassignSelectedArea() {
    const selectedProvince = selectedProvinceHit?.province

    if (!selectedProvince) {
      return
    }

    const editorState = editorStateRef.current
    const selectedProvinceState = getProvinceState(selectedProvince)
    const provincesToUnassign =
      paintUnit === 'state' && selectedProvinceState
        ? selectedProvinceState.provinces
        : [selectedProvince]

    if (
      !wouldChangeProvinceAssignments(
        editorState.provinceAssignments,
        provincesToUnassign,
        null,
      )
    ) {
      return
    }

    const nextEditorState = updateProvinceAssignments(
      editorState,
      provincesToUnassign,
      null,
    )
    commitEditorState(nextEditorState)
    renderProvinceAssignmentPatch(provincesToUnassign, null, nextEditorState)
  }

  return {
    effectiveTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    paintMode,
    paintUnit,
    selectTool: setSelectedTool,
    selectedProvinceHit,
    selectedState,
    setPaintMode,
    setPaintUnit,
    setTemporaryPanActive,
    unassignSelectedArea,
  }
}
