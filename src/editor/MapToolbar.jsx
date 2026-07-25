import { useId, useRef, useState } from 'react'
import styles from '../admin/AdminMapEditorPage.module.css'
import { ChoiceInput } from './ChoiceInput'

export function MapToolbar({
  activeTool,
  onActiveToolChange,
  onPaintModeChange,
  onPaintUnitChange,
  paintMode,
  paintUnit,
}) {
  const paintSettingsId = useId()
  const paintSettingsButtonRef = useRef(null)
  const [isPaintSettingsOpen, setIsPaintSettingsOpen] = useState(false)

  function closePaintSettings() {
    setIsPaintSettingsOpen(false)
  }

  function handlePaintModeChange(nextPaintMode) {
    onPaintModeChange(nextPaintMode)
    setIsPaintSettingsOpen(true)
  }

  function handlePaintUnitChange(nextPaintUnit) {
    onPaintUnitChange(nextPaintUnit)
    setIsPaintSettingsOpen(true)
  }

  function handlePaintSettingsKeyDown(event) {
    if (event.key !== 'Escape') {
      return
    }

    event.stopPropagation()
    closePaintSettings()
    paintSettingsButtonRef.current?.focus()
  }

  return (
    <ul
      className={`${styles.mapToolbar} m-0 flex list-none flex-row gap-1.5 border border-line-strong bg-white p-1.5 [&>li]:flex [&>li]:gap-1`}
      role="toolbar"
      aria-label="지도 도구"
    >
      <li className="relative" onKeyDown={handlePaintSettingsKeyDown}>
        <ChoiceInput
          checked={activeTool === 'paint'}
          name="map-tool"
          value="paint"
          onChange={() => onActiveToolChange('paint')}
        >
          그리기
        </ChoiceInput>
        <button
          ref={paintSettingsButtonRef}
          type="button"
          className="grid min-w-7 place-items-center text-base"
          aria-controls={paintSettingsId}
          aria-expanded={isPaintSettingsOpen}
          aria-haspopup="dialog"
          aria-label="그리기 설정"
          onClick={() => setIsPaintSettingsOpen((isOpen) => !isOpen)}
        >
          ▽
        </button>
        <div
          className={`${styles.toolbarMenuContent} grid w-max max-w-70 gap-1.5 border border-line-strong bg-white p-1.5`}
          hidden={!isPaintSettingsOpen}
          id={paintSettingsId}
          role="dialog"
          aria-label="그리기 설정"
        >
          <fieldset className="m-0 flex gap-1.5 *:flex-1">
            <legend className="sr-only">페인트 모드</legend>
            <ChoiceInput
              checked={paintMode === 'single'}
              name="paint-mode"
              value="single"
              onChange={() => handlePaintModeChange('single')}
            >
              단일 채우기
            </ChoiceInput>
            <ChoiceInput
              checked={paintMode === 'multi'}
              name="paint-mode"
              value="multi"
              onChange={() => handlePaintModeChange('multi')}
            >
              다중 채우기
            </ChoiceInput>
          </fieldset>

          <fieldset className="m-0 flex gap-1.5 *:flex-1">
            <legend className="sr-only">색칠 단위</legend>
            <ChoiceInput
              checked={paintUnit === 'province'}
              name="paint-unit"
              value="province"
              onChange={() => handlePaintUnitChange('province')}
            >
              Province 별 색칠
            </ChoiceInput>
            <ChoiceInput
              checked={paintUnit === 'state'}
              name="paint-unit"
              value="state"
              onChange={() => handlePaintUnitChange('state')}
            >
              State 별 색칠
            </ChoiceInput>
          </fieldset>
        </div>
      </li>

      <li>
        <ChoiceInput
          checked={activeTool === 'eyedropper'}
          name="map-tool"
          value="eyedropper"
          onChange={() => onActiveToolChange('eyedropper')}
        >
          스포이드
        </ChoiceInput>
      </li>

      <li>
        <ChoiceInput
          checked={activeTool === 'erase'}
          name="map-tool"
          value="erase"
          onChange={() => onActiveToolChange('erase')}
        >
          지우개
        </ChoiceInput>
      </li>

      <li>
        <ChoiceInput
          checked={activeTool === 'hand'}
          name="map-tool"
          value="hand"
          onChange={() => onActiveToolChange('hand')}
        >
          화면 이동
        </ChoiceInput>
      </li>
    </ul>
  )
}
