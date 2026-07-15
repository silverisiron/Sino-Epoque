export function ProvinceInfo({ isEditor, onRemoveAssignment, selectedCountry, selectedProvince, selectedState }) {
  return (
    <section className="province-info" aria-labelledby="province-title">
      <h2 id="province-title">Province</h2>
      {selectedProvince?.province ? (
        <dl>
          <div>
            <dt>ID</dt>
            <dd>{selectedProvince.province.id}</dd>
          </div>
          <div>
            <dt>Terrain</dt>
            <dd>{selectedProvince.province.terrain}</dd>
          </div>
          <div>
            <dt>Type</dt>
            <dd>{selectedProvince.province.type}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{selectedCountry?.name ?? '미배정'}</dd>
          </div>
          <div>
            <dt>State</dt>
            <dd>{selectedState?.displayName ?? '없음'}</dd>
          </div>
        </dl>
      ) : (
        <p>프로빈스를 클릭하세요.</p>
      )}
      {isEditor ? (
        <button type="button" className="full-button" onClick={onRemoveAssignment}>
          Clear Selected Province
        </button>
      ) : null}
    </section>
  )
}
