import styles from '../admin/AdminMapEditorPage.module.css'

export function LayerTypeFieldset({ autonomyTypes, onToggle, selectedTypeIds }) {
  const availableTypes = Object.entries(autonomyTypes)
    .filter(([, type]) => type.autonomy < 10)
    .sort(([, left], [, right]) => right.autonomy - left.autonomy)

  return (
    <fieldset className={styles.layerTypeFieldset}>
      <legend>자치도 유형</legend>
      <div className={styles.layerTypeList}>
        {availableTypes.map(([typeId, type]) => (
          <label className={styles.layerTypeOption} key={typeId}>
            <input
              type="checkbox"
              checked={selectedTypeIds.includes(typeId)}
              onChange={() => onToggle(typeId)}
            />
            <span>{type.name}</span>
            <small>{type.englishName || typeId}</small>
            <strong>{type.autonomy}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
