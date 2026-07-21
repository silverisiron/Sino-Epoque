import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { EditorModal } from './EditorModal'
import { LayerTypeFieldset } from './LayerTypeFieldset'

const LAYER_MODES = [
  ['autonomy', '자치도 유형'],
  ['powerRank', '국가 등급'],
  ['powerBloc', '세력 블록'],
]

export function SphereLayerModal({
  autonomyTypes,
  countries,
  onApply,
  onClose,
  powerBlocs,
  powerRankTypes,
  settings,
}) {
  const [mode, setMode] = useState(settings.mode ?? 'autonomy')
  const [selectedIdsByMode, setSelectedIdsByMode] = useState(
    settings.selectedIdsByMode ?? {
      autonomy: settings.selectedTypeIds ?? [],
      powerRank: [],
      powerBloc: [],
    },
  )
  const [opacityByIdByMode, setOpacityByIdByMode] = useState(
    settings.opacityByIdByMode ?? {
      autonomy: settings.opacityByType ?? {},
      powerRank: {},
      powerBloc: {},
    },
  )
  const powerBlocItems = Object.fromEntries(
    Object.entries(powerBlocs).map(([blocId, bloc]) => [
      blocId,
      {
        name: bloc.name,
        englishName: countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId,
      },
    ]),
  )
  const layerConfig = {
    autonomy: {
      defaultOpacity: 90,
      filterItem: (type) => type.autonomy < 10,
      items: autonomyTypes,
      legend: '자치도 유형',
      valueKey: 'autonomy',
    },
    powerRank: {
      defaultOpacity: (type) => type.level * 10,
      items: powerRankTypes,
      legend: '국가 등급',
      valueKey: 'level',
    },
    powerBloc: {
      defaultOpacity: 90,
      items: powerBlocItems,
      legend: '세력 블록',
    },
  }[mode]

  function toggleType(typeId) {
    setSelectedIdsByMode((currentSelections) => {
      const currentTypeIds = currentSelections[mode] ?? []
      return {
        ...currentSelections,
        [mode]: currentTypeIds.includes(typeId)
          ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
          : [...currentTypeIds, typeId],
      }
    })
  }

  function changeOpacity(typeId, opacity) {
    setOpacityByIdByMode((currentOpacityByMode) => ({
      ...currentOpacityByMode,
      [mode]: {
        ...currentOpacityByMode[mode],
        [typeId]: opacity,
      },
    }))
  }

  function applyChanges() {
    onApply({ mode, selectedIdsByMode, opacityByIdByMode })
    return true
  }

  return (
    <EditorModal
      enableSelectAll
      labelledBy="sphere-layer-title"
      onApply={applyChanges}
      onClose={onClose}
      title="레이어 설정"
    >
      <div className={styles.layerModeSelector} role="group" aria-label="지도 레이어 종류">
        {LAYER_MODES.map(([layerMode, label]) => (
          <button
            type="button"
            aria-pressed={mode === layerMode}
            key={layerMode}
            onClick={() => setMode(layerMode)}
          >
            {label}
          </button>
        ))}
      </div>

      <LayerTypeFieldset
        defaultOpacity={layerConfig.defaultOpacity}
        filterItem={layerConfig.filterItem}
        items={layerConfig.items}
        legend={layerConfig.legend}
        onOpacityChange={changeOpacity}
        onToggle={toggleType}
        opacityByType={opacityByIdByMode[mode] ?? {}}
        selectedTypeIds={selectedIdsByMode[mode] ?? []}
        valueKey={layerConfig.valueKey}
      />
    </EditorModal>
  )
}
