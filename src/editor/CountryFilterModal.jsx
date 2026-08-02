import { useState } from 'react'
import { createPowerBlocItems } from './model/powerBlocOperations'
import { EditorModal } from './EditorModal'
import { LayerTypeFieldset } from './LayerTypeFieldset'
import { SelectAllButton } from './SelectAllButton'

export function CountryFilterModal({
  applyCountryFilter,
  autonomyTypes,
  countries,
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

  const powerBlocItems = createPowerBlocItems(powerBlocs, countries)
  const availableIdsByCategory = {
    autonomy: Object.entries(autonomyTypes)
      .filter(([, type]) => type.autonomy < 10)
      .map(([typeId]) => typeId),
    powerRank: Object.keys(powerRankTypes),
    powerBloc: Object.keys(powerBlocItems),
  }

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

  function submitCountryFilter() {
    applyCountryFilter({
      independentCountryId,
      autonomyTypeIds: selectedIds.autonomy,
      powerRankTypeIds: selectedIds.powerRank,
      powerBlocIds: selectedIds.powerBloc,
    })
    return true
  }

  function toggleAllFilterTypes() {
    const shouldSelectAll = Object.entries(availableIdsByCategory).some(
      ([category, typeIds]) =>
        typeIds.some((typeId) => !selectedIds[category].includes(typeId)),
    )

    setSelectedIds(
      Object.fromEntries(
        Object.entries(availableIdsByCategory).map(([category, typeIds]) => [
          category,
          shouldSelectAll ? typeIds : [],
        ]),
      ),
    )
  }

  return (
    <EditorModal
      closeOnSubmit
      labelledBy="country-filter-title"
      onClose={onClose}
      onSubmit={submitCountryFilter}
      showSaveAlert={false}
      submitLabel="검색"
      title="국가 목록 필터"
    >
      <SelectAllButton onToggle={toggleAllFilterTypes} />

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
