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
  onAutonomyTypesDelete,
  onAutonomyTypeUpdate,
  onPowerBlocDelete,
  onPowerBlocUpdate,
  onPowerRankTypeDelete,
  onPowerRankTypesDelete,
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
        onDeleteSelected={onAutonomyTypesDelete}
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
        onDeleteSelected={onPowerRankTypesDelete}
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
