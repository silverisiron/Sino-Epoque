export function ProvinceInfo({ isEditor, onRemoveAssignment, selectedCountry, selectedProvince, selectedState }) {
  return (
    <section className="border-t border-[#d5dbe3] pt-3" aria-labelledby="province-title">
      <h2 id="province-title">프로빈스</h2>
      {selectedProvince?.province ? (
        <dl className="grid gap-1.5">
          <div>
            <dt>ID</dt>
            <dd>{selectedProvince.province.id}</dd>
          </div>
          <div>
            <dt>Terrain (지형)</dt>
            <dd>{selectedProvince.province.terrain}</dd>
          </div>
          <div>
            <dt>Type (타입)</dt>
            <dd>{selectedProvince.province.type}</dd>
          </div>
          <div>
            <dt>Country (국가)</dt>
            <dd>{selectedCountry?.name ?? '미배정'}</dd>
          </div>
          <div>
            <dt>State (주 명칭)</dt>
            <dd>{selectedState?.displayName ?? '없음'}</dd>
          </div>
        </dl>
      ) : (
        <p>프로빈스를 클릭하세요.</p>
      )}
      {isEditor ? (
        <button type="button" className="mt-2.5 w-full" onClick={onRemoveAssignment}>
          프로빈스 선택 해제
        </button>
      ) : null}
    </section>
  )
}
