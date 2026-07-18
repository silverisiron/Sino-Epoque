import { downloadJson } from '../map/mapData'
import styles from '../admin/AdminMapEditorPage.module.css'

export function CountryPanel({
  activeColor,
  borderMode,
  countries,
  onAddCountry,
  onBorderModeChange,
  onCountryColorChange,
  onCountryNameChange,
  onPaintModeChange,
  onPaintUnitChange,
  onSelectColor,
  paintMode,
  paintUnit,
  preset,
}) {
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

      <div className={styles.countryList}>
        {Object.entries(countries).map(([color, country]) => (
          <article className={styles.countryRow} data-active={activeColor === color} key={color}>
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
              value={color}
              onChange={(event) => onCountryColorChange(color, event.target.value)}
            />
          </article>
        ))}
      </div>

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
