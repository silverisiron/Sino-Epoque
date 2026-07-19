import { useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { downloadJson } from '../map/mapData'

function CountryRow({
  activeColor,
  color,
  country,
  draggedColor,
  onCountryDragEnd,
  onCountryDragStart,
  onCountryColorChange,
  onCountryDrop,
  onCountryNameChange,
  onSelectColor,
}) {
  const [draftColor, setDraftColor] = useState(color)

  function applyColor() {
    if (draftColor !== color) {
      onCountryColorChange(color, draftColor)
    }
  }

  return (
    <li
      className={styles.countryRow}
      data-active={activeColor === color}
      data-dragging={draggedColor === color}
      draggable
      onDragEnd={onCountryDragEnd}
      onDragOver={(event) => event.preventDefault()}
      onDragStart={(event) => onCountryDragStart(event, color)}
      onDrop={(event) => onCountryDrop(event, color)}
    >
      <button
        type="button"
        className={styles.swatchButton}
        style={{ backgroundColor: color }}
        aria-label={`${country.name} 선택`}
        onClick={() => onSelectColor(color)}
      />
      <input
        aria-label="국가 이름"
        value={country.name}
        onChange={(event) => onCountryNameChange(color, event.target.value)}
      />
      <input
        aria-label="국가 색상"
        type="color"
        value={draftColor}
        onChange={(event) => setDraftColor(event.target.value)}
      />
      <button type="button" onClick={applyColor} disabled={draftColor === color}>
        적용
      </button>
    </li>
  )
}

export function CountryPanel({
  activeColor,
  borderMode,
  countries,
  onAddCountry,
  onBorderModeChange,
  onCountryColorChange,
  onCountryOrderChange,
  onCountryNameChange,
  onPaintModeChange,
  onPaintUnitChange,
  onSelectColor,
  paintMode,
  paintUnit,
  preset,
}) {
  const [draggedColor, setDraggedColor] = useState(null)

  function handleCountryDragStart(event, color) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', color)
    setDraggedColor(color)
  }

  function handleCountryDrop(event, targetColor) {
    event.preventDefault()
    const sourceColor = event.dataTransfer.getData('text/plain') || draggedColor

    if (!sourceColor || sourceColor === targetColor) {
      setDraggedColor(null)
      return
    }

    const orderedColors = Object.keys(countries)
    const sourceIndex = orderedColors.indexOf(sourceColor)
    const targetIndex = orderedColors.indexOf(targetColor)

    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedColor(null)
      return
    }

    orderedColors.splice(sourceIndex, 1)
    orderedColors.splice(targetIndex, 0, sourceColor)
    onCountryOrderChange(orderedColors)
    setDraggedColor(null)
  }

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

      <ul className={styles.countryList}>
        {Object.entries(countries).map(([color, country]) => (
          <CountryRow
            activeColor={activeColor}
            color={color}
            country={country}
            draggedColor={draggedColor}
            key={color}
            onCountryDragEnd={() => setDraggedColor(null)}
            onCountryDragStart={handleCountryDragStart}
            onCountryColorChange={onCountryColorChange}
            onCountryDrop={handleCountryDrop}
            onCountryNameChange={onCountryNameChange}
            onSelectColor={onSelectColor}
          />
        ))}
      </ul>

      <button
        type="button"
        className={styles.fullButton}
        onClick={() => downloadJson('map-preset.json', preset)}
      >
         JSON으로 프리셋 저장하기
      </button>
    </section>
  )
}
