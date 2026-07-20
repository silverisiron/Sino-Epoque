import styles from '../admin/AdminMapEditorPage.module.css'

export function LayerTypeFieldset({
  defaultOpacity = 90,
  filterItem = () => true,
  items,
  legend,
  onOpacityChange,
  onToggle,
  opacityByType,
  selectedTypeIds,
  valueKey,
}) {
  const availableTypes = Object.entries(items)
    .filter(([, item]) => filterItem(item))
    .sort(([, left], [, right]) => (right[valueKey] ?? 0) - (left[valueKey] ?? 0))

  return (
    <fieldset className={styles.layerTypeFieldset}>
      <legend>{legend}</legend>
      <div className={styles.layerTypeList}>
        {availableTypes.map(([typeId, type]) => {
          const opacity =
            opacityByType?.[typeId] ??
            (typeof defaultOpacity === 'function' ? defaultOpacity(type) : defaultOpacity)

          return (
            <div className={styles.layerTypeOption} key={typeId}>
              <label className={styles.layerTypeOptionHeader}>
                <input
                  type="checkbox"
                  checked={selectedTypeIds.includes(typeId)}
                  onChange={() => onToggle(typeId)}
                />
                <span>{type.name}</span>
                <small>{type.englishName || typeId}</small>
                {valueKey ? <strong>{type[valueKey]}</strong> : null}
              </label>
              {onOpacityChange ? (
                <details className={styles.typeOpacityDetails}>
                  <summary>불투명도 {opacity}%</summary>
                  <label className={styles.opacityControl}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={opacity}
                      onChange={(event) =>
                        onOpacityChange(typeId, Number(event.target.value))
                      }
                    />
                    <output>{opacity}%</output>
                  </label>
                </details>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
