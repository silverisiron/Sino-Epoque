import { useDeferredValue, useMemo, useState } from 'react'
import { downloadJson } from '../map/mapData'
import { createCountryBlocIndex, getTopIndependentCountryId } from '../map/worldRelations'
import { CountryEditModal } from './CountryEditModal'
import { CountryFilterModal } from './CountryFilterModal'
import { PanelHeader } from './PanelHeader'

const EMPTY_COUNTRY_FILTER = {
  independentCountryId: '',
  autonomyTypeIds: [],
  powerRankTypeIds: [],
  powerBlocIds: [],
}

function CountryRow({
  activeCountryId,
  autonomyType,
  powerRankType,
  country,
  countryId,
  draggedCountryId,
  onCountryDragEnd,
  onCountryDragStart,
  onCountryDrop,
  onEdit,
  onSelectCountry,
}) {
  return (
    <li
      className="grid cursor-pointer grid-cols-[14px_30px_minmax(0,1fr)_auto] items-center gap-2 border border-[#d5dbe3] p-1.5 data-[active=true]:border-[#17202a] data-[dragging=true]:opacity-50"
      data-active={activeCountryId === countryId}
      data-dragging={draggedCountryId === countryId}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onCountryDrop(event, countryId)}
      onClick={() => onSelectCountry(countryId)}
    >
      <button
        type="button"
        className="w-3.5 min-w-3.5 cursor-grab self-stretch min-h-0! border-0! p-0! active:cursor-grabbing"
        draggable
        aria-label={`${country.name} 순서 변경`}
        title="드래그하여 순서 변경"
        onClick={(event) => event.stopPropagation()}
        onDragEnd={onCountryDragEnd}
        onDragStart={(event) => onCountryDragStart(event, countryId)}
      >
        ⋮
      </button>
      <button
        type="button"
        className="h-7 w-7 min-h-7! border border-[#17202a]"
        style={{ backgroundColor: country.color }}
        aria-label={`${country.name} 선택`}
        onClick={() => onSelectCountry(countryId)}
      />
      <div className="grid min-w-0 gap-0.5 [&>span]:truncate [&>span]:text-xs [&>span]:text-[#667085] [&>strong]:truncate">
        <strong>{country.name}</strong>
        <span>
          {autonomyType.name} · {autonomyType.autonomy}
        </span>
        <span>
          {powerRankType.name} · {powerRankType.level}
        </span>
      </div>
      <button type="button" onClick={() => onEdit(countryId)}>
        편집
      </button>
    </li>
  )
}

export function CountryPanel({
  activeCountryId,
  autonomyTypes,
  countries,
  countryOrder,
  onAddCountry,
  onCountryOrderChange,
  onCountryUpdate,
  onSelectCountry,
  powerBlocs,
  powerRankTypes,
  preset,
}) {
  const [draggedCountryId, setDraggedCountryId] = useState(null)
  const [editingCountryId, setEditingCountryId] = useState(null)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState(EMPTY_COUNTRY_FILTER)
  const deferredSearchQuery = useDeferredValue(searchQuery)

  const countrySearchIndex = useMemo(
    () =>
      new Map(
        Object.entries(countries).map(([countryId, country]) => [
          countryId,
          country.name.normalize('NFKC').toLocaleLowerCase(),
        ]),
      ),
    [countries],
  )
  const blocIdByCountry = useMemo(
    () => createCountryBlocIndex(powerBlocs, countries, autonomyTypes),
    [autonomyTypes, countries, powerBlocs],
  )

  const visibleCountryIds = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().normalize('NFKC').toLocaleLowerCase()
    const autonomyTypeIds = new Set(countryFilter.autonomyTypeIds)
    const powerRankTypeIds = new Set(countryFilter.powerRankTypeIds)
    const powerBlocIds = new Set(countryFilter.powerBlocIds)

    return countryOrder.filter((countryId) => {
      const country = countries[countryId]

      if (!country || !countrySearchIndex.get(countryId)?.includes(normalizedQuery)) {
        return false
      }

      if (autonomyTypeIds.size > 0 && !autonomyTypeIds.has(country.autonomyTypeId)) {
        return false
      }

      if (powerRankTypeIds.size > 0 && !powerRankTypeIds.has(country.powerRankTypeId)) {
        return false
      }

      if (powerBlocIds.size > 0 && !powerBlocIds.has(blocIdByCountry.get(countryId))) {
        return false
      }

      return !countryFilter.independentCountryId ||
        getTopIndependentCountryId(countryId, countries, autonomyTypes) ===
          countryFilter.independentCountryId
    })
  }, [
    autonomyTypes,
    blocIdByCountry,
    countries,
    countryFilter,
    countryOrder,
    countrySearchIndex,
    deferredSearchQuery,
  ])

  function applyCountryFilter(nextFilter) {
    setCountryFilter({
      independentCountryId: countries[nextFilter.independentCountryId]
        ? nextFilter.independentCountryId
        : '',
      autonomyTypeIds: nextFilter.autonomyTypeIds.filter(
        (typeId) => autonomyTypes[typeId]?.autonomy < 10,
      ),
      powerRankTypeIds: nextFilter.powerRankTypeIds.filter(
        (typeId) => powerRankTypes[typeId],
      ),
      powerBlocIds: nextFilter.powerBlocIds.filter((blocId) => powerBlocs[blocId]),
    })
  }

  function handleCountryDragStart(event, countryId) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', countryId)
    setDraggedCountryId(countryId)
  }

  function handleCountryDrop(event, targetCountryId) {
    event.preventDefault()
    const sourceCountryId = event.dataTransfer.getData('text/plain') || draggedCountryId

    if (!sourceCountryId || sourceCountryId === targetCountryId) {
      setDraggedCountryId(null)
      return
    }

    const orderedCountryIds = [...countryOrder]
    const sourceIndex = orderedCountryIds.indexOf(sourceCountryId)
    const targetIndex = orderedCountryIds.indexOf(targetCountryId)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedCountryId(null)
      return
    }

    orderedCountryIds.splice(sourceIndex, 1)
    orderedCountryIds.splice(targetIndex, 0, sourceCountryId)
    onCountryOrderChange(orderedCountryIds)
    setDraggedCountryId(null)
  }

  const editingCountry = editingCountryId ? countries[editingCountryId] : null

  return (
    <section aria-labelledby="countries-title">
      <PanelHeader headingId="countries-title" onAction={onAddCountry} title="Countries" />

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 [&>input]:min-w-0">
        <input
          aria-label="국가 검색"
          placeholder="국가 검색"
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <button
          type="button"
          aria-pressed={
            Boolean(countryFilter.independentCountryId) ||
            countryFilter.autonomyTypeIds.length > 0 ||
            countryFilter.powerRankTypeIds.length > 0 ||
            countryFilter.powerBlocIds.length > 0
          }
          onClick={() => setIsFilterModalOpen(true)}
        >
          필터
        </button>
      </div>

      <ul className="my-3 grid max-h-[40vh] list-none gap-2 overflow-y-auto overscroll-contain p-0">
        {visibleCountryIds.map((countryId) => {
          const country = countries[countryId]

          if (!country) {
            return null
          }

          return (
            <CountryRow
              activeCountryId={activeCountryId}
              autonomyType={autonomyTypes[country.autonomyTypeId] ?? autonomyTypes.independent}
              powerRankType={powerRankTypes[country.powerRankTypeId] ?? powerRankTypes.decentralized}
              country={country}
              countryId={countryId}
              draggedCountryId={draggedCountryId}
              key={countryId}
              onCountryDragEnd={() => setDraggedCountryId(null)}
              onCountryDragStart={handleCountryDragStart}
              onCountryDrop={handleCountryDrop}
              onEdit={setEditingCountryId}
              onSelectCountry={onSelectCountry}
            />
          )
        })}
        {visibleCountryIds.length === 0 ? (
          <li className="px-1.5 py-3 text-center text-[#667085]">
            검색 결과가 없습니다.
          </li>
        ) : null}
      </ul>

      <button
        type="button"
        className="mt-2.5 w-full"
        onClick={() => downloadJson('map-preset.json', preset)}
      >
        JSON으로 프리셋 저장하기
      </button>

      {editingCountry ? (
        <CountryEditModal
          autonomyTypes={autonomyTypes}
          countries={countries}
          country={editingCountry}
          countryId={editingCountryId}
          countryOrder={countryOrder}
          onApply={(nextCountry) => onCountryUpdate(editingCountryId, nextCountry)}
          onClose={() => setEditingCountryId(null)}
          powerRankTypes={powerRankTypes}
        />
      ) : null}

      {isFilterModalOpen ? (
        <CountryFilterModal
          autonomyTypes={autonomyTypes}
          countries={countries}
          onApply={applyCountryFilter}
          onClose={() => setIsFilterModalOpen(false)}
          powerBlocs={powerBlocs}
          powerRankTypes={powerRankTypes}
          settings={countryFilter}
        />
      ) : null}
    </section>
  )
}
