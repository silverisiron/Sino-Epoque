import { useState } from 'react'
import { PanelSection } from './PanelSection'

function downloadPresetJson(preset) {
  const blob = new Blob([JSON.stringify(preset, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = 'map-preset.json'
  anchor.click()
  URL.revokeObjectURL(url)
}

export function PresetPanel({
  exportPng,
  onLoadPreset,
  onSelectedPresetPathChange,
  pngExportDisabled,
  preset,
  presetIndex,
  selectedPresetPath,
}) {
  const [isExportingPng, setIsExportingPng] = useState(false)

  async function handlePngExport() {
    setIsExportingPng(true)

    try {
      await exportPng()
    } finally {
      setIsExportingPng(false)
    }
  }

  return (
    <>
      <PanelSection headingId="presets-title" title="프리셋">
        <label>
          프리셋 파일
          <select
            value={selectedPresetPath}
            onChange={(event) => onSelectedPresetPathChange(event.target.value)}
          >
            {presetIndex.map((presetItem) => (
              <option key={presetItem.path} value={presetItem.path}>
                {presetItem.name}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="w-full" onClick={onLoadPreset}>
          프리셋 불러오기
        </button>
      </PanelSection>

      <PanelSection headingId="map-export-title" title="지도 내보내기">
        <button
          type="button"
          className="w-full"
          onClick={() => downloadPresetJson(preset)}
        >
          JSON으로 프리셋 저장하기
        </button>

        <button
          type="button"
          className="w-full"
          disabled={pngExportDisabled || isExportingPng}
          onClick={handlePngExport}
        >
          {isExportingPng ? 'PNG 생성 중...' : '원본 해상도 PNG로 저장하기'}
        </button>
      </PanelSection>
    </>
  )
}
