const COUNTRY_LAYER_MODES = new Set(['autonomy', 'powerRank', 'powerBloc'])

export function createDefaultCountryLayerSettings() {
  return {
    mode: 'autonomy',
    selectedIdsByMode: {
      autonomy: [],
      powerRank: [],
      powerBloc: [],
    },
    opacityByIdByMode: {
      autonomy: {},
      powerRank: {},
      powerBloc: {},
    },
  }
}

export function normalizeCountryLayerSettings(
  settings,
  { autonomyTypes, powerBlocs, powerRankTypes },
) {
  const mode = COUNTRY_LAYER_MODES.has(settings.mode)
    ? settings.mode
    : 'autonomy'
  const availableIdsByMode = {
    autonomy: new Set(
      Object.entries(autonomyTypes)
        .filter(([, type]) => type.autonomy < 10)
        .map(([typeId]) => typeId),
    ),
    powerRank: new Set(Object.keys(powerRankTypes)),
    powerBloc: new Set(Object.keys(powerBlocs)),
  }
  const selectedIdsByMode = Object.fromEntries(
    Object.entries(availableIdsByMode).map(([layerMode, availableIds]) => [
      layerMode,
      (settings.selectedIdsByMode?.[layerMode] ?? []).filter((id) =>
        availableIds.has(id),
      ),
    ]),
  )
  const opacityByIdByMode = Object.fromEntries(
    Object.entries(selectedIdsByMode).map(([layerMode, selectedIds]) => [
      layerMode,
      Object.fromEntries(
        selectedIds.map((id) => {
          const defaultOpacity =
            layerMode === 'powerRank' ? powerRankTypes[id].level * 10 : 90
          const requestedOpacity = Number(
            settings.opacityByIdByMode?.[layerMode]?.[id] ?? defaultOpacity,
          )

          return [id, Math.min(100, Math.max(0, requestedOpacity))]
        }),
      ),
    ]),
  )

  return { mode, selectedIdsByMode, opacityByIdByMode }
}
