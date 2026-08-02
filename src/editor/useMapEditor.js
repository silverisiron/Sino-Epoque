import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as classificationOperations from './model/classificationOperations'
import * as countryOperations from './model/countryOperations'
import {
  createEditorStateFromPreset,
  createInitialEditorState,
  createPresetFromEditorState,
} from './model/editorState'
import * as powerBlocOperations from './model/powerBlocOperations'
import {
  createDefaultCountryLayerSettings,
  normalizeCountryLayerSettings,
} from './model/countryLayerSettings'
import { fetchNormalizedPreset } from './presetRepository'
import { useEditorHistory } from './useEditorHistory'
import { useMapInteraction } from './useMapInteraction'

export function useMapEditor({
  mapRenderer,
  mapScrollRef,
  mapSize,
  provinceByRgbRef,
  selectedPresetPath,
  setStatus,
  setWorkspaceMode,
  sourceImageDataRef,
  stateByProvinceRef,
  statesByIdRef,
  workspaceMode,
}) {
  const [initialEditorState] = useState(createInitialEditorState)
  const {
    canRedo,
    canUndo,
    commitEditorState,
    editorState,
    editorStateRef,
    recordHistoryCheckpoint,
    redoEditorState,
    replaceEditorState,
    undoEditorState,
  } = useEditorHistory(initialEditorState)
  const [countryLayerSettings, setCountryLayerSettings] = useState(
    createDefaultCountryLayerSettings,
  )
  const countryLayerSettingsRef = useRef(countryLayerSettings)

  const {
    activeCountryId,
    autonomyTypes,
    countries,
    countryOrder,
    powerBlocs,
    powerRankTypes,
    provinceAssignments,
  } = editorState

  const renderEditorState = useCallback(
    (state) => {
      mapRenderer.renderProvinceAssignments(
        state.provinceAssignments,
        state.countries,
      )
      mapRenderer.renderCountryLayer(
        state.provinceAssignments,
        state.countries,
        state.autonomyTypes,
        state.powerRankTypes,
        state.powerBlocs,
        countryLayerSettingsRef.current,
      )
    },
    [mapRenderer],
  )

  const selectCountry = useCallback(
    (countryId) => {
      const currentEditorState = editorStateRef.current

      if (currentEditorState.activeCountryId === countryId) {
        return
      }

      commitEditorState(
        { ...currentEditorState, activeCountryId: countryId },
        { recordHistory: false },
      )
    },
    [commitEditorState, editorStateRef],
  )

  const interaction = useMapInteraction({
    commitEditorState,
    editorStateRef,
    mapRenderer,
    mapScrollRef,
    provinceByRgbRef,
    recordHistoryCheckpoint,
    selectCountry,
    setStatus,
    sourceImageDataRef,
    countryLayerSettingsRef,
    stateByProvinceRef,
    statesByIdRef,
    workspaceMode,
  })

  const preset = useMemo(
    () => createPresetFromEditorState(editorState),
    [editorState],
  )

  useEffect(() => {
    mapRenderer.renderProvinceAssignments(
      editorStateRef.current.provinceAssignments,
      countries,
    )
  }, [countries, editorStateRef, mapRenderer, mapSize])

  useEffect(() => {
    countryLayerSettingsRef.current = countryLayerSettings
    mapRenderer.renderCountryLayer(
      editorStateRef.current.provinceAssignments,
      countries,
      autonomyTypes,
      powerRankTypes,
      powerBlocs,
      countryLayerSettings,
    )
  }, [
    autonomyTypes,
    countries,
    editorStateRef,
    mapRenderer,
    mapSize,
    powerBlocs,
    powerRankTypes,
    countryLayerSettings,
  ])

  function commitCommand(result, successStatus, { render = false } = {}) {
    if (!result.ok) {
      if (result.error) {
        setStatus(result.error)
      }

      return false
    }

    const changed = result.editorState !== editorStateRef.current

    if (changed) {
      commitEditorState(result.editorState)

      if (render) {
        renderEditorState(result.editorState)
      }
    }

    if (changed && successStatus) {
      setStatus(successStatus)
    }

    return true
  }

  function addCountry() {
    commitCommand(countryOperations.addCountry(editorStateRef.current))
  }

  function updateCountry(countryId, countryChanges) {
    return commitCommand(
      countryOperations.updateCountry(
        editorStateRef.current,
        countryId,
        countryChanges,
      ),
      '국가 정보가 적용되었습니다.',
    )
  }

  function deleteCountry(countryId) {
    return commitCommand(
      countryOperations.deleteCountry(editorStateRef.current, countryId),
      '국가가 삭제되었습니다.',
      { render: true },
    )
  }

  function reorderCountries(orderedCountryIds) {
    commitCommand(
      countryOperations.reorderCountries(
        editorStateRef.current,
        orderedCountryIds,
      ),
    )
  }

  function addAutonomyType() {
    commitCommand(
      classificationOperations.addAutonomyType(editorStateRef.current),
    )
  }

  function updateAutonomyType(typeId, typeChanges) {
    return commitCommand(
      classificationOperations.updateAutonomyType(
        editorStateRef.current,
        typeId,
        typeChanges,
      ),
      '자치도 유형이 적용되었습니다.',
    )
  }

  function deleteAutonomyTypes(typeIds) {
    const result = classificationOperations.deleteAutonomyTypes(
      editorStateRef.current,
      typeIds,
    )

    if (!commitCommand(result)) {
      return []
    }

    setStatus(`자치도 유형 ${result.deletedIds.length}개가 삭제되었습니다.`)
    return result.deletedIds
  }

  function deleteAutonomyType(typeId) {
    return deleteAutonomyTypes([typeId]).length > 0
  }

  function addPowerRankType() {
    commitCommand(
      classificationOperations.addPowerRankType(editorStateRef.current),
    )
  }

  function updatePowerRankType(typeId, typeChanges) {
    return commitCommand(
      classificationOperations.updatePowerRankType(
        editorStateRef.current,
        typeId,
        typeChanges,
      ),
      '국가 등급이 적용되었습니다.',
    )
  }

  function deletePowerRankTypes(typeIds) {
    const result = classificationOperations.deletePowerRankTypes(
      editorStateRef.current,
      typeIds,
    )

    if (!commitCommand(result)) {
      return []
    }

    setStatus(`국가 등급 ${result.deletedIds.length}개가 삭제되었습니다.`)
    return result.deletedIds
  }

  function deletePowerRankType(typeId) {
    return deletePowerRankTypes([typeId]).length > 0
  }

  function addPowerBloc(blocChanges) {
    return commitCommand(
      powerBlocOperations.addPowerBloc(editorStateRef.current, blocChanges),
      '세력 블록이 적용되었습니다.',
    )
  }

  function updatePowerBloc(blocId, blocChanges) {
    return commitCommand(
      powerBlocOperations.updatePowerBloc(
        editorStateRef.current,
        blocId,
        blocChanges,
      ),
      '세력 블록이 적용되었습니다.',
    )
  }

  function deletePowerBlocs(blocIds) {
    const result = powerBlocOperations.deletePowerBlocs(
      editorStateRef.current,
      blocIds,
    )

    if (!result.ok) {
      return []
    }

    commitEditorState(result.editorState)
    setStatus(`세력 블록 ${result.deletedIds.length}개가 삭제되었습니다.`)
    return result.deletedIds
  }

  function deletePowerBloc(blocId) {
    return deletePowerBlocs([blocId]).length > 0
  }

  function updateCountryLayerSettings(settings) {
    setCountryLayerSettings(
      normalizeCountryLayerSettings(settings, editorStateRef.current),
    )
  }

  function undo() {
    const previousEditorState = undoEditorState()

    if (!previousEditorState) {
      return
    }

    renderEditorState(previousEditorState)
    setStatus('실행 취소')
  }

  function redo() {
    const nextEditorState = redoEditorState()

    if (!nextEditorState) {
      return
    }

    renderEditorState(nextEditorState)
    setStatus('다시 실행')
  }

  async function loadPreset(path = selectedPresetPath) {
    if (!path) {
      return false
    }

    try {
      const normalizedPreset = await fetchNormalizedPreset(path)
      const nextEditorState = createEditorStateFromPreset(normalizedPreset)

      replaceEditorState(nextEditorState)
      renderEditorState(nextEditorState)
      setWorkspaceMode('loader')
      setStatus('프리셋 로드 완료')
      return true
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : '프리셋 로드에 실패했습니다.',
      )
      return false
    }
  }

  const selectedCountryId = interaction.selectedProvinceHit?.province
    ? provinceAssignments[interaction.selectedProvinceHit.province.id]
    : null
  const selectedCountry = selectedCountryId
    ? countries[selectedCountryId]
    : null

  return {
    activeCountryId,
    addAutonomyType,
    addCountry,
    addPowerBloc,
    addPowerRankType,
    autonomyTypes,
    canRedo,
    canUndo,
    countries,
    countryOrder,
    deleteAutonomyType,
    deleteAutonomyTypes,
    deleteCountry,
    deletePowerBloc,
    deletePowerBlocs,
    deletePowerRankType,
    deletePowerRankTypes,
    effectiveTool: interaction.effectiveTool,
    handlePointerDown: interaction.handlePointerDown,
    handlePointerMove: interaction.handlePointerMove,
    handlePointerUp: interaction.handlePointerUp,
    loadPreset,
    paintMode: interaction.paintMode,
    paintUnit: interaction.paintUnit,
    powerBlocs,
    powerRankTypes,
    preset,
    redo,
    reorderCountries,
    selectCountry,
    selectTool: interaction.selectTool,
    selectedCountry,
    selectedProvinceHit: interaction.selectedProvinceHit,
    selectedState: interaction.selectedState,
    setPaintMode: interaction.setPaintMode,
    setPaintUnit: interaction.setPaintUnit,
    setTemporaryPanActive: interaction.setTemporaryPanActive,
    countryLayerSettings,
    unassignSelectedArea: interaction.unassignSelectedArea,
    undo,
    updateAutonomyType,
    updateCountry,
    updatePowerBloc,
    updatePowerRankType,
    updateCountryLayerSettings,
  }
}
