export function PresetLoader({
  onLoadPreset,
  onSelectedPresetPathChange,
  presetIndex,
  selectedPresetPath,
}) {
  return (
    <section aria-labelledby="presets-title">
      <h2 id="presets-title">프리셋</h2>
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
      <button type="button" className="full-button" onClick={onLoadPreset}>
        프리셋 불러오기
      </button>
    </section>
  )
}
