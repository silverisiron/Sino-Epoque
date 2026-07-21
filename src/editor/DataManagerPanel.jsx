import { NumericTypePanel } from './NumericTypePanel'
import { PanelHeader } from './PanelHeader'
import { PowerBlocPanel } from './PowerBlocPanel'

export function DataManagerPanel({
  autonomyTypes,
  countries,
  countryOrder,
  onAddAutonomyType,
  onAddPowerBloc,
  onAddPowerRankType,
  onAutonomyTypeDelete,
  onAutonomyTypeUpdate,
  onPowerBlocDelete,
  onPowerBlocUpdate,
  onPowerRankTypeDelete,
  onPowerRankTypeUpdate,
  powerBlocs,
  powerRankTypes,
}) {
  return (
    <section aria-labelledby="data-managers-title">
      <PanelHeader headingId="data-managers-title" title="설정" />
      <NumericTypePanel
        heading="Autonomy Types"
        isInUse={(typeId) =>
          Object.keys(autonomyTypes).length <= 1 ||
          Object.values(countries).some((country) => country.autonomyTypeId === typeId)
        }
        onAdd={onAddAutonomyType}
        onDelete={onAutonomyTypeDelete}
        onUpdate={onAutonomyTypeUpdate}
        summary="자치도 유형 관리"
        types={autonomyTypes}
        valueKey="autonomy"
        valueLabel="자치도 유형"
      />

      <NumericTypePanel
        heading="Power Ranks"
        isInUse={(typeId) =>
          Object.keys(powerRankTypes).length <= 1 ||
          Object.values(countries).some((country) => country.powerRankTypeId === typeId)
        }
        onAdd={onAddPowerRankType}
        onDelete={onPowerRankTypeDelete}
        onUpdate={onPowerRankTypeUpdate}
        summary="국가 등급 관리"
        types={powerRankTypes}
        valueKey="level"
        valueLabel="국가 등급"
      />

      <PowerBlocPanel
        autonomyTypes={autonomyTypes}
        countries={countries}
        countryOrder={countryOrder}
        onAdd={onAddPowerBloc}
        onDelete={onPowerBlocDelete}
        onUpdate={onPowerBlocUpdate}
        powerBlocs={powerBlocs}
        powerRankTypes={powerRankTypes}
      />
    </section>
  )
}
