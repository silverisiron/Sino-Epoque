import { useId, useRef, useState } from 'react'
import { ChoiceInput } from './ChoiceInput'

export function MapToolbar({
  effectiveTool,
  onToolSelect,
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
      className="absolute bottom-4 left-1/2 z-5 flex -translate-x-1/2 list-none flex-row gap-1.5 bg-white [&>li]:flex [&>li]:gap-1"
      role="toolbar"
      aria-label="지도 도구"
    >
      <li className="relative" onKeyDown={handlePaintSettingsKeyDown}>
        <ChoiceInput
          checked={effectiveTool === 'paint'}
          name="map-tool"
          value="paint"
          onChange={() => onToolSelect('paint')}
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
          className="absolute bottom-0 left-[calc(100%+6px)] z-100 grid w-max max-w-70 gap-1.5 bg-white"
          hidden={!isPaintSettingsOpen}
          id={paintSettingsId}
          role="dialog"
          aria-label="그리기 설정"
        >
          <fieldset className="flex gap-1.5 *:flex-1">
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

          <fieldset className="flex gap-1.5 *:flex-1">
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
          checked={effectiveTool === 'eyedropper'}
          name="map-tool"
          value="eyedropper"
          onChange={() => onToolSelect('eyedropper')}
        >
          스포이드
        </ChoiceInput>
      </li>

      <li>
        <ChoiceInput
          checked={effectiveTool === 'erase'}
          name="map-tool"
          value="erase"
          onChange={() => onToolSelect('erase')}
        >
          지우개
        </ChoiceInput>
      </li>

      <li>
        <ChoiceInput
          checked={effectiveTool === 'hand'}
          name="map-tool"
          value="hand"
          onChange={() => onToolSelect('hand')}
        >
          화면 이동
        </ChoiceInput>
      </li>
    </ul>
  )
}
