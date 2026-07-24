export function LayerTypeFieldset({
  defaultOpacity = 90,
  filterItem = () => true,
  items,
  legend,
  onOpacityChange,
  onToggle,
  opacityByType,
  selectedTypeIds,
  valueKey,
}) {
  const availableTypes = Object.entries(items)
    .filter(([, item]) => filterItem(item))
    .sort(([, left], [, right]) => (right[valueKey] ?? 0) - (left[valueKey] ?? 0))

  return (
    <fieldset className="m-0 min-w-0 border border-[#d5dbe3] p-2.5">
      <legend className="px-1 text-sm font-semibold">{legend}</legend>
      <div className="grid max-h-[42vh] gap-1.5 overflow-y-auto">
        {availableTypes.map(([typeId, type]) => {
          const opacity =
            opacityByType?.[typeId] ??
            (typeof defaultOpacity === 'function' ? defaultOpacity(type) : defaultOpacity)

          return (
            <div className="border-b border-[#e6e9ee] px-0.5 py-1.5" key={typeId}>
              <label className="grid grid-cols-[20px_minmax(0,1fr)_minmax(0,1fr)_28px] items-center">
                <input
                  className="min-h-0!"
                  type="checkbox"
                  checked={selectedTypeIds.includes(typeId)}
                  onChange={() => onToggle(typeId)}
                />
                <span>{type.name}</span>
                <small className="truncate text-[#667085]">
                  {type.englishName || typeId}
                </small>
                {valueKey ? <strong className="text-right">{type[valueKey]}</strong> : null}
              </label>
              {onOpacityChange ? (
                <details className="mt-1.5 ml-5">
                  <summary className="cursor-pointer text-[13px]">불투명도 {opacity}%</summary>
                  <label className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center [&>input]:w-full [&>output]:min-w-12 [&>output]:text-right [&>span]:col-span-full">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={opacity}
                      onChange={(event) =>
                        onOpacityChange(typeId, Number(event.target.value))
                      }
                    />
                    <output>{opacity}%</output>
                  </label>
                </details>
              ) : null}
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}
