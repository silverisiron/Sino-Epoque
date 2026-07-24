import styles from '../admin/AdminMapEditorPage.module.css'

export function MapToolbar({
  activeTool,
  onActiveToolChange,
  onPaintModeChange,
  onPaintUnitChange,
  paintMode,
  paintUnit,
}) {
  return (
    <ul
      className={`${styles.mapToolbar} m-0 flex list-none flex-row gap-1.5 border border-[#aeb7c2] bg-white p-1.5 [&>li]:flex [&>li]:gap-1`}
      role="toolbar"
      aria-label="지도 도구"
    >
      <li className="relative">
        <button
          type="button"
          aria-pressed={activeTool === 'paint'}
          onClick={() => onActiveToolChange('paint')}
        >
          그리기
        </button>
        <details className={styles.toolbarMenu}>
          <summary
            className="grid min-h-8 min-w-7 cursor-pointer list-none place-items-center border border-[#aeb7c2]"
            aria-label="그리기 설정"
          >
            ▽
          </summary>
          <div
            className={`${styles.toolbarMenuContent} grid w-max max-w-70 gap-1.5 border border-[#aeb7c2] bg-white p-1.5`}
          >
            <div
              className="m-0 flex gap-1.5 [&>button]:flex-1"
              role="group"
              aria-label="페인트 모드"
            >
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

            <div
              className="m-0 flex gap-1.5 [&>button]:flex-1"
              role="group"
              aria-label="색칠 단위"
            >
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
          </div>
        </details>
      </li>

      <li>
        <button
          type="button"
          aria-pressed={activeTool === 'eyedropper'}
          onClick={() => onActiveToolChange('eyedropper')}
        >
          스포이드
        </button>
      </li>

      <li>
        <button
          type="button"
          aria-pressed={activeTool === 'erase'}
          onClick={() => onActiveToolChange('erase')}
        >
          지우개
        </button>
      </li>

      <li>
        <button
          type="button"
          aria-pressed={activeTool === 'hand'}
          onClick={() => onActiveToolChange('hand')}
        >
          화면 이동
        </button>
      </li>
    </ul>
  )
}
