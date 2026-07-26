import { NumericTypePanel } from './NumericTypePanel'
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
    <>
      <NumericTypePanel
        heading="Autonomy Types"
        headingId="autonomy-types-title"
        isInUse={(typeId) =>
          Object.keys(autonomyTypes).length <= 1 ||
          Object.values(countries).some((country) => country.autonomyTypeId === typeId)
        }
        onAdd={onAddAutonomyType}
        onDelete={onAutonomyTypeDelete}
        onUpdate={onAutonomyTypeUpdate}
        types={autonomyTypes}
        valueKey="autonomy"
        valueLabel="자치도 유형"
      />

      <NumericTypePanel
        heading="Power Ranks"
        headingId="power-ranks-title"
        isInUse={(typeId) =>
          Object.keys(powerRankTypes).length <= 1 ||
          Object.values(countries).some((country) => country.powerRankTypeId === typeId)
        }
        onAdd={onAddPowerRankType}
        onDelete={onPowerRankTypeDelete}
        onUpdate={onPowerRankTypeUpdate}
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
    </>
  )
}
