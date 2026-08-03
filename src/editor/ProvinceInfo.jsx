import { PanelSection } from './PanelSection'

export function ProvinceInfo({
  isEditor,
  onUnassignSelectedArea,
  selectedCountry,
  selectedProvinceHit,
  selectedState,
}) {
  return (
    <PanelSection headingId="province-title" title="프로빈스">
      {selectedProvinceHit?.province ? (
        <dl className="grid gap-1.5">
          <div>
            <dt>ID</dt>
            <dd>{selectedProvinceHit.province.id}</dd>
          </div>
          <div>
            <dt>Terrain (지형)</dt>
            <dd>{selectedProvinceHit.province.terrain}</dd>
          </div>
          <div>
            <dt>Type (타입)</dt>
            <dd>{selectedProvinceHit.province.type}</dd>
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
        <button
          type="button"
          className="w-full"
          onClick={onUnassignSelectedArea}
        >
          선택 영역 국가 배정 해제
        </button>
      ) : null}
    </PanelSection>
  )
}
