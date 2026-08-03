import {
  createDefaultAutonomyTypes,
  createDefaultPowerRankTypes,
  DEFAULT_AUTONOMY_TYPE_ID,
  DEFAULT_POWER_RANK_TYPE_ID,
} from '../../map/presetSchema'

const INITIAL_COUNTRY_ID = 'country_1'

export function createInitialEditorState() {
  return {
    activeCountryId: INITIAL_COUNTRY_ID,
    autonomyTypes: createDefaultAutonomyTypes(),
    countries: {
      [INITIAL_COUNTRY_ID]: {
        name: '국가 1',
        color: '#d94645',
        autonomyTypeId: DEFAULT_AUTONOMY_TYPE_ID,
        powerRankTypeId: DEFAULT_POWER_RANK_TYPE_ID,
        overlordId: null,
      },
    },
    countryOrder: [INITIAL_COUNTRY_ID],
    powerBlocs: {},
    powerRankTypes: createDefaultPowerRankTypes(),
    provinceAssignments: {},
  }
}

export function createEditorStateFromPreset(preset) {
  return {
    activeCountryId: preset.countryOrder[0] ?? '',
    autonomyTypes: preset.autonomyTypes,
    countries: preset.countries,
    countryOrder: preset.countryOrder,
    powerBlocs: preset.powerBlocs,
    powerRankTypes: preset.powerRankTypes,
    provinceAssignments: preset.provinceAssignments,
  }
}

export function createPresetFromEditorState(editorState) {
  return {
    version: 3,
    baseMap: 'base',
    autonomyTypes: editorState.autonomyTypes,
    powerRankTypes: editorState.powerRankTypes,
    powerBlocs: editorState.powerBlocs,
    countries: editorState.countries,
    countryOrder: editorState.countryOrder,
    provinceAssignments: editorState.provinceAssignments,
  }
}
