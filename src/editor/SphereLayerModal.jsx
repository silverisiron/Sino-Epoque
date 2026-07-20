import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { EditorModal } from './EditorModal'
import { LayerTypeFieldset } from './LayerTypeFieldset'

export function SphereLayerModal({ autonomyTypes, onApply, onClose, settings }) {
  const [selectedTypeIds, setSelectedTypeIds] = useState(settings.selectedTypeIds)
  const [opacity, setOpacity] = useState(settings.opacity)
  function toggleType(typeId) {
    setSelectedTypeIds((currentTypeIds) =>
      currentTypeIds.includes(typeId)
        ? currentTypeIds.filter((currentTypeId) => currentTypeId !== typeId)
        : [...currentTypeIds, typeId],
    )
  }

  function handleSubmit(event) {
    event.preventDefault()
    onApply({ selectedTypeIds, opacity })
    onClose()
  }

  return (
    <EditorModal labelledBy="sphere-layer-title" onClose={onClose}>
        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <header className={styles.modalHeader}>
            <h2 id="sphere-layer-title">세력권 레이어</h2>
            <div className={styles.modalActions}>
              <button type="submit">적용</button>
              <button type="button" aria-label="닫기" onClick={onClose}>
                ×
              </button>
            </div>
          </header>

          <LayerTypeFieldset
            autonomyTypes={autonomyTypes}
            onToggle={toggleType}
            selectedTypeIds={selectedTypeIds}
          />

          <label className={styles.opacityControl}>
            <span>종주국 색상 불투명도</span>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={opacity}
              onChange={(event) => setOpacity(Number(event.target.value))}
            />
            <output>{opacity}%</output>
          </label>
        </form>
    </EditorModal>
  )
}
