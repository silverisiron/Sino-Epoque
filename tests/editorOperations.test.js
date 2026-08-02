import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context)
    } catch (error) {
      if (
        error.code === 'ERR_MODULE_NOT_FOUND' &&
        (specifier.startsWith('./') || specifier.startsWith('../')) &&
        !specifier.endsWith('.js')
      ) {
        return nextResolve(`${specifier}.js`, context)
      }

      throw error
    }
  },
})

const [
  {
    addAutonomyType,
    addPowerRankType,
    deleteAutonomyTypes,
    deletePowerRankTypes,
    updateAutonomyType,
    updatePowerRankType,
  },
  { addCountry, deleteCountry, updateCountry },
  { createInitialEditorState },
  { addPowerBloc },
  { updateProvinceAssignments, wouldChangeProvinceAssignments },
] = await Promise.all([
  import('../src/editor/model/classificationOperations.js'),
  import('../src/editor/model/countryOperations.js'),
  import('../src/editor/model/editorState.js'),
  import('../src/editor/model/powerBlocOperations.js'),
  import('../src/editor/model/provinceAssignmentOperations.js'),
])

function addCountries(editorState, count) {
  let nextEditorState = editorState

  for (let index = 0; index < count; index += 1) {
    const result = addCountry(nextEditorState)
    assert.equal(result.ok, true)
    nextEditorState = result.editorState
  }

  return nextEditorState
}

test('addCountry creates the next id and selects the new country', () => {
  const editorState = createInitialEditorState()
  const result = addCountry(editorState)

  assert.equal(result.ok, true)
  assert.equal(result.value, 'country_2')
  assert.equal(result.editorState.activeCountryId, 'country_2')
  assert.deepEqual(result.editorState.countryOrder, ['country_1', 'country_2'])
  assert.equal(result.editorState.countries.country_2.name, '국가 2')
  assert.notEqual(
    result.editorState.countries.country_2.color,
    editorState.countries.country_1.color,
  )
  assert.equal(editorState.countries.country_2, undefined)
})

test('updateCountry rejects duplicate colors and cyclic overlord relationships', () => {
  const editorState = addCountries(createInitialEditorState(), 1)
  const duplicateColorResult = updateCountry(editorState, 'country_2', {
    ...editorState.countries.country_2,
    color: editorState.countries.country_1.color.toUpperCase(),
  })

  assert.equal(duplicateColorResult.ok, false)
  assert.equal(duplicateColorResult.editorState, editorState)
  assert.match(duplicateColorResult.error, /색상/)

  const subjectResult = updateCountry(editorState, 'country_2', {
    ...editorState.countries.country_2,
    autonomyTypeId: 'puppet',
    overlordId: 'country_1',
  })
  assert.equal(subjectResult.ok, true)

  const cycleResult = updateCountry(subjectResult.editorState, 'country_1', {
    ...subjectResult.editorState.countries.country_1,
    autonomyTypeId: 'puppet',
    overlordId: 'country_2',
  })

  assert.equal(cycleResult.ok, false)
  assert.equal(cycleResult.editorState, subjectResult.editorState)
  assert.match(cycleResult.error, /순환/)
})

test('deleteCountry cascades through assignments, subjects, blocs, members, and selection', () => {
  const editorStateWithCountries = addCountries(createInitialEditorState(), 3)
  const editorState = {
    ...editorStateWithCountries,
    activeCountryId: 'country_2',
    countries: {
      ...editorStateWithCountries.countries,
      country_3: {
        ...editorStateWithCountries.countries.country_3,
        autonomyTypeId: 'puppet',
        overlordId: 'country_2',
      },
    },
    powerBlocs: {
      deletedLeaderBloc: {
        name: 'Deleted Leader Bloc',
        leaderCountryId: 'country_2',
        memberCountryIds: ['country_1'],
      },
      survivingBloc: {
        name: 'Surviving Bloc',
        leaderCountryId: 'country_1',
        memberCountryIds: ['country_2', 'country_4'],
      },
    },
    provinceAssignments: {
      province_1: 'country_2',
      province_2: 'country_1',
      province_3: 'country_3',
    },
  }

  const result = deleteCountry(editorState, 'country_2')

  assert.equal(result.ok, true)
  assert.equal(result.value, 'country_2')
  assert.equal(result.editorState.countries.country_2, undefined)
  assert.deepEqual(result.editorState.countryOrder, [
    'country_1',
    'country_3',
    'country_4',
  ])
  assert.equal(result.editorState.activeCountryId, 'country_3')
  assert.equal(result.editorState.countries.country_3.autonomyTypeId, 'independent')
  assert.equal(result.editorState.countries.country_3.overlordId, null)
  assert.deepEqual(result.editorState.provinceAssignments, {
    province_2: 'country_1',
    province_3: 'country_3',
  })
  assert.equal(result.editorState.powerBlocs.deletedLeaderBloc, undefined)
  assert.deepEqual(result.editorState.powerBlocs.survivingBloc.memberCountryIds, [
    'country_4',
  ])
})

test('classification updates enforce autonomy and power-rank constraints', () => {
  const editorState = createInitialEditorState()
  const autonomyResult = updateAutonomyType(editorState, 'independent', {
    ...editorState.autonomyTypes.independent,
    autonomy: 9,
  })

  assert.equal(autonomyResult.ok, false)
  assert.equal(autonomyResult.editorState, editorState)
  assert.match(autonomyResult.error, /종주국/)

  const blocLeaderState = {
    ...editorState,
    countries: {
      country_1: {
        ...editorState.countries.country_1,
        powerRankTypeId: 'great_power',
      },
    },
    powerBlocs: {
      power_bloc_1: {
        name: 'Bloc',
        leaderCountryId: 'country_1',
        memberCountryIds: [],
      },
    },
  }
  const rankResult = updatePowerRankType(blocLeaderState, 'great_power', {
    ...blocLeaderState.powerRankTypes.great_power,
    level: 6,
  })

  assert.equal(rankResult.ok, false)
  assert.equal(rankResult.editorState, blocLeaderState)
  assert.match(rankResult.error, /7 이상/)
})

test('bulk classification deletion skips in-use types and protects the final type', () => {
  const editorState = createInitialEditorState()
  const autonomyAddResult = addAutonomyType(editorState)
  const autonomyDeleteResult = deleteAutonomyTypes(autonomyAddResult.editorState, [
    'independent',
    'custom_1',
  ])

  assert.equal(autonomyDeleteResult.ok, true)
  assert.deepEqual(autonomyDeleteResult.deletedIds, ['custom_1'])
  assert.ok(autonomyDeleteResult.editorState.autonomyTypes.independent)

  const rankAddResult = addPowerRankType(editorState)
  const rankDeleteResult = deletePowerRankTypes(rankAddResult.editorState, [
    'decentralized',
    'custom_1',
  ])

  assert.equal(rankDeleteResult.ok, true)
  assert.deepEqual(rankDeleteResult.deletedIds, ['custom_1'])
  assert.ok(rankDeleteResult.editorState.powerRankTypes.decentralized)

  const oneTypeState = {
    ...editorState,
    autonomyTypes: {
      only: { name: 'Only', englishName: '', autonomy: 10 },
    },
    countries: {},
    countryOrder: [],
    powerRankTypes: {
      only: { name: 'Only', englishName: '', level: 1 },
    },
  }

  const finalAutonomyResult = deleteAutonomyTypes(oneTypeState, ['only'])
  const finalRankResult = deletePowerRankTypes(oneTypeState, ['only'])

  assert.equal(finalAutonomyResult.ok, false)
  assert.equal(finalAutonomyResult.editorState, oneTypeState)
  assert.equal(finalRankResult.ok, false)
  assert.equal(finalRankResult.editorState, oneTypeState)
})

test('addPowerBloc validates its leader and rejects duplicate membership', () => {
  const editorStateWithCountries = addCountries(createInitialEditorState(), 2)
  const editorState = {
    ...editorStateWithCountries,
    countries: {
      ...editorStateWithCountries.countries,
      country_1: {
        ...editorStateWithCountries.countries.country_1,
        powerRankTypeId: 'great_power',
      },
      country_2: {
        ...editorStateWithCountries.countries.country_2,
        powerRankTypeId: 'great_power',
      },
    },
  }

  const invalidLeaderResult = addPowerBloc(editorState, {
    name: 'Invalid Bloc',
    leaderCountryId: 'country_3',
    memberCountryIds: [],
  })

  assert.equal(invalidLeaderResult.ok, false)
  assert.equal(invalidLeaderResult.editorState, editorState)
  assert.match(invalidLeaderResult.error, /대표국/)

  const firstBlocResult = addPowerBloc(editorState, {
    name: '  First Bloc  ',
    leaderCountryId: 'country_1',
    memberCountryIds: ['country_1', 'country_3', 'country_3', 'missing'],
  })

  assert.equal(firstBlocResult.ok, true)
  assert.equal(firstBlocResult.value, 'power_bloc_1')
  assert.deepEqual(firstBlocResult.editorState.powerBlocs.power_bloc_1, {
    name: 'First Bloc',
    leaderCountryId: 'country_1',
    memberCountryIds: ['country_3'],
  })

  const duplicateMembershipResult = addPowerBloc(firstBlocResult.editorState, {
    name: 'Second Bloc',
    leaderCountryId: 'country_2',
    memberCountryIds: ['country_3'],
  })

  assert.equal(duplicateMembershipResult.ok, false)
  assert.equal(duplicateMembershipResult.editorState, firstBlocResult.editorState)
  assert.match(duplicateMembershipResult.error, /하나의 세력 블록/)
})

test('province assignments support add, remove, and identity-preserving no-op updates', () => {
  const editorState = createInitialEditorState()
  const provinces = [{ id: 'province_1' }, { id: 'province_2' }]

  assert.equal(
    wouldChangeProvinceAssignments(
      editorState.provinceAssignments,
      provinces,
      'country_1',
    ),
    true,
  )

  const assignedState = updateProvinceAssignments(editorState, provinces, 'country_1')
  assert.deepEqual(assignedState.provinceAssignments, {
    province_1: 'country_1',
    province_2: 'country_1',
  })

  const unchangedAssignedState = updateProvinceAssignments(
    assignedState,
    provinces,
    'country_1',
  )
  assert.equal(unchangedAssignedState, assignedState)

  const partiallyUnassignedState = updateProvinceAssignments(
    assignedState,
    [provinces[0]],
    null,
  )
  assert.deepEqual(partiallyUnassignedState.provinceAssignments, {
    province_2: 'country_1',
  })

  const unchangedUnassignedState = updateProvinceAssignments(
    partiallyUnassignedState,
    [provinces[0]],
    null,
  )
  assert.equal(unchangedUnassignedState, partiallyUnassignedState)
})
