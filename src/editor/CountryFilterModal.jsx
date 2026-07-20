import { useState } from 'react'
import { EditorModal } from './EditorModal'
import { LayerTypeFieldset } from './LayerTypeFieldset'

export function CountryFilterModal({
  autonomyTypes,
  countries,
  onApply,
  onClose,
  powerBlocs,
  powerRankTypes,
  settings,
}) {
  const [independentCountryId, setIndependentCountryId] = useState(
    settings.independentCountryId,
  )
  const [selectedIds, setSelectedIds] = useState({
    autonomy: settings.autonomyTypeIds ?? [],
    powerRank: settings.powerRankTypeIds ?? [],
    powerBloc: settings.powerBlocIds ?? [],
  })
  const independentCountries = Object.entries(countries)
    .filter(([, country]) => autonomyTypes[country.autonomyTypeId]?.autonomy === 10)
    .sort(([, left], [, right]) => left.name.localeCompare(right.name, 'ko'))

  const powerBlocItems = Object.fromEntries(
    Object.entries(powerBlocs).map(([blocId, bloc]) => [
      blocId,
      {
        name: bloc.name,
        englishName: countries[bloc.leaderCountryId]?.name ?? bloc.leaderCountryId,
      },
    ]),
  )

  function toggleType(category, typeId) {
    setSelectedIds((currentSelections) => {
      const currentTypeIds = currentSelections[category]
      return {
        ...currentSelections,
        [category]: currentTypeIds.includes(typeId)
          ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
          : [...currentTypeIds, typeId],
      }
    })
  }

  function applyFilter() {
    onApply({
      independentCountryId,
      autonomyTypeIds: selectedIds.autonomy,
      powerRankTypeIds: selectedIds.powerRank,
      powerBlocIds: selectedIds.powerBloc,
    })
    return true
  }

  return (
    <EditorModal
      applyLabel="검색"
      closeOnApply
      labelledBy="country-filter-title"
      onApply={applyFilter}
      onClose={onClose}
      showSaveAlert={false}
      title="국가 목록 필터"
    >
      <label>
        최상위 독립국
        <select
          value={independentCountryId}
          onChange={(event) => setIndependentCountryId(event.target.value)}
        >
          <option value="">모든 독립국</option>
          {independentCountries.map(([countryId, country]) => (
            <option key={countryId} value={countryId}>
              {country.name}
            </option>
          ))}
        </select>
      </label>

      <LayerTypeFieldset
        filterItem={(type) => type.autonomy < 10}
        items={autonomyTypes}
        legend="자치도 유형"
        onToggle={(typeId) => toggleType('autonomy', typeId)}
        selectedTypeIds={selectedIds.autonomy}
        valueKey="autonomy"
      />

      <LayerTypeFieldset
        items={powerRankTypes}
        legend="국가 등급"
        onToggle={(typeId) => toggleType('powerRank', typeId)}
        selectedTypeIds={selectedIds.powerRank}
        valueKey="level"
      />

      <LayerTypeFieldset
        items={powerBlocItems}
        legend="세력 블록"
        onToggle={(blocId) => toggleType('powerBloc', blocId)}
        selectedTypeIds={selectedIds.powerBloc}
      />
    </EditorModal>
  )
}
