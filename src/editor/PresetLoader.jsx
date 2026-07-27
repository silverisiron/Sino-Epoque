import { PanelSection } from './PanelSection'

export function PresetLoader({
  onLoadPreset,
  onSelectedPresetPathChange,
  presetIndex,
  selectedPresetPath,
}) {
  return (
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
  )
}
