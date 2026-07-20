import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { EditorModal } from './EditorModal'
import { LayerTypeFieldset } from './LayerTypeFieldset'

export function CountryFilterModal({ autonomyTypes, countries, onApply, onClose, settings }) {
  const [independentCountryId, setIndependentCountryId] = useState(
    settings.independentCountryId,
  )
  const [selectedTypeIds, setSelectedTypeIds] = useState(settings.selectedTypeIds)
  const independentCountries = Object.entries(countries)
    .filter(([, country]) => autonomyTypes[country.autonomyTypeId]?.autonomy === 10)
    .sort(([, left], [, right]) => left.name.localeCompare(right.name, 'ko'))

  function toggleType(typeId) {
    setSelectedTypeIds((currentTypeIds) =>
      currentTypeIds.includes(typeId)
        ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
        : [...currentTypeIds, typeId],
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    onApply({ independentCountryId, selectedTypeIds })
    onClose()
  }

  return (
    <EditorModal labelledBy="country-filter-title" onClose={onClose}>
      <form className={styles.modalForm} onSubmit={handleSubmit}>
        <header className={styles.modalHeader}>
          <h2 id="country-filter-title">국가 목록 필터</h2>
          <div className={styles.modalActions}>
            <button type="submit">검색</button>
            <button type="button" aria-label="닫기" onClick={onClose}>
              ×
            </button>
          </div>
        </header>

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
          autonomyTypes={autonomyTypes}
          onToggle={toggleType}
          selectedTypeIds={selectedTypeIds}
        />
      </form>
    </EditorModal>
  )
}
