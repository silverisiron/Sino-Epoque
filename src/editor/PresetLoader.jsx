export function PresetLoader({
  onLoadPreset,
  onSelectedPresetPathChange,
  presetIndex,
  selectedPresetPath,
}) {
  return (
    <section aria-labelledby="presets-title">
      <h2 id="presets-title">Presets</h2>
      <label>
        Preset file
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
        Load Preset
      </button>
    </section>
  )
}
