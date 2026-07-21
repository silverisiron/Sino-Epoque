import { useDeferredValue, useMemo, useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { downloadJson } from '../map/mapData'
import { createCountryBlocIndex, getTopIndependentCountryId } from '../map/worldRelations'
import { CountryEditModal } from './CountryEditModal'
import { CountryFilterModal } from './CountryFilterModal'
import { NumericTypePanel } from './NumericTypePanel'
import { PowerBlocPanel } from './PowerBlocPanel'

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
      className={styles.countryRow}
      data-active={activeCountryId === countryId}
      data-dragging={draggedCountryId === countryId}
      draggable
      onDragEnd={onCountryDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={(event) => onCountryDragStart(event, countryId)}
      onDrop={(event) => onCountryDrop(event, countryId)}
    >
      <button
        type="button"
        className={styles.swatchButton}
        style={{ backgroundColor: country.color }}
        aria-label={`${country.name} 선택`}
        onClick={() => onSelectCountry(countryId)}
      />
      <div className={styles.countrySummary}>
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
  borderMode,
  countries,
  countryOrder,
  onAddAutonomyType,
  onAddCountry,
  onAddPowerBloc,
  onAddPowerRankType,
  onAutonomyTypeDelete,
  onAutonomyTypeUpdate,
  onBorderModeChange,
  onCountryOrderChange,
  onCountryUpdate,
  onPaintModeChange,
  onPaintUnitChange,
  onSelectCountry,
  paintMode,
  paintUnit,
  powerBlocs,
  powerRankTypes,
  onPowerBlocDelete,
  onPowerBlocUpdate,
  onPowerRankTypeDelete,
  onPowerRankTypeUpdate,
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
      <div className={styles.sideHeader}>
        <h2 id="countries-title">Countries</h2>
        <button type="button" onClick={onAddCountry}>
          추가
        </button>
      </div>

      <div className={styles.paintModes} role="group" aria-label="페인트 모드">
        <button
          type="button"
          aria-pressed={paintMode === 'single'}
          onClick={() => onPaintModeChange('single')}
        >
          단일 채우기
        </button>
        <button
          type="button"
          aria-pressed={paintMode === 'multi'}
          onClick={() => onPaintModeChange('multi')}
        >
          다중 채우기
        </button>
      </div>

      <div className={styles.paintModes} role="group" aria-label="색칠 단위">
        <button
          type="button"
          aria-pressed={paintUnit === 'province'}
          onClick={() => onPaintUnitChange('province')}
        >
          Province 별 색칠
        </button>
        <button
          type="button"
          aria-pressed={paintUnit === 'state'}
          onClick={() => onPaintUnitChange('state')}
        >
          State 별 색칠
        </button>
      </div>

      <div className={styles.paintModes} role="group" aria-label="경계선 표시">
        <button
          type="button"
          aria-pressed={borderMode === 'province'}
          onClick={() => onBorderModeChange('province')}
        >
          Province 국경
        </button>
        <button
          type="button"
          aria-pressed={borderMode === 'state'}
          onClick={() => onBorderModeChange('state')}
        >
          State 국경
        </button>
        <button
          type="button"
          aria-pressed={borderMode === 'none'}
          onClick={() => onBorderModeChange('none')}
        >
          국경 표시 없음
        </button>
      </div>

      <div className={styles.countrySearch}>
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

      <ul className={styles.countryList}>
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
          <li className={styles.emptyCountryList}>검색 결과가 없습니다.</li>
        ) : null}
      </ul>

      <NumericTypePanel
        heading="Autonomy Types"
        isInUse={(typeId) =>
          Object.keys(autonomyTypes).length <= 1 ||
          Object.values(countries).some((country) => country.autonomyTypeId === typeId)
        }
        onAdd={onAddAutonomyType}
        onDelete={onAutonomyTypeDelete}
        onUpdate={onAutonomyTypeUpdate}
        summary="자치도 유형 관리"
        types={autonomyTypes}
        valueKey="autonomy"
        valueLabel="자치도 유형"
      />

      <NumericTypePanel
        heading="Power Ranks"
        isInUse={(typeId) =>
          Object.keys(powerRankTypes).length <= 1 ||
          Object.values(countries).some((country) => country.powerRankTypeId === typeId)
        }
        onAdd={onAddPowerRankType}
        onDelete={onPowerRankTypeDelete}
        onUpdate={onPowerRankTypeUpdate}
        summary="국가 등급 관리"
        types={powerRankTypes}
        valueKey="level"
        valueLabel="국가 등급"
      />

      <PowerBlocPanel
        autonomyTypes={autonomyTypes}
        countries={countries}
        countryOrder={countryOrder}
        onAdd={onAddPowerBloc}
        onDelete={onPowerBlocDelete}
        onUpdate={onPowerBlocUpdate}
        powerBlocs={powerBlocs}
        powerRankTypes={powerRankTypes}
      />

      <button
        type="button"
        className={styles.fullButton}
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
