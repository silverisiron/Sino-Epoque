import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DEFAULT_AUTONOMY_TYPE_ID,
  DEFAULT_POWER_RANK_TYPE_ID,
  getAvailableTypeId,
  normalizePreset,
} from '../src/map/presetSchema.js'

test('getAvailableTypeId prefers the requested type and otherwise selects by scale', () => {
  const types = {
    low: { value: 1 },
    middle: { value: 5 },
    high: { value: 10 },
  }

  assert.equal(getAvailableTypeId(types, 'middle', 'value', true), 'middle')
  assert.equal(getAvailableTypeId(types, 'missing', 'value', true), 'high')
  assert.equal(getAvailableTypeId(types, 'missing', 'value', false), 'low')
  assert.equal(getAvailableTypeId({}, 'missing', 'value', true), '')
})

test('normalizePreset migrates a version-one color-keyed preset to country ids', () => {
  const normalized = normalizePreset({
    baseMap: 'legacy-map',
    countries: {
      '#ff0000': { name: '  Red Country  ' },
      '#00ff00': { name: 'Green Country' },
    },
    provinceAssignments: {
      1: '#ff0000',
      2: '#00ff00',
      3: '#unknown',
    },
  })

  assert.equal(normalized.version, 3)
  assert.equal(normalized.baseMap, 'legacy-map')
  assert.deepEqual(normalized.countryOrder, ['country_1', 'country_2'])
  assert.deepEqual(normalized.provinceAssignments, {
    1: 'country_1',
    2: 'country_2',
  })
  assert.deepEqual(normalized.countries.country_1, {
    name: 'Red Country',
    color: '#ff0000',
    autonomyTypeId: DEFAULT_AUTONOMY_TYPE_ID,
    powerRankTypeId: DEFAULT_POWER_RANK_TYPE_ID,
    overlordId: null,
  })
  assert.equal(normalized.autonomyTypes[DEFAULT_AUTONOMY_TYPE_ID].autonomy, 10)
  assert.equal(normalized.powerRankTypes[DEFAULT_POWER_RANK_TYPE_ID].level, 1)
  assert.deepEqual(normalized.powerBlocs, {})
})

test('normalizePreset keeps a version-three custom schema and repairs references', () => {
  const normalized = normalizePreset({
    version: 3,
    autonomyTypes: {
      sovereign: { name: '  Sovereign  ', englishName: ' Sovereign ', autonomy: 99 },
      subject: { name: 'Subject', englishName: '', autonomy: 0 },
    },
    powerRankTypes: {
      high: { name: 'High', englishName: '', level: 99 },
      low: { name: ' Low ', englishName: '', level: 0 },
    },
    countries: {
      sovereignCountry: {
        name: '  Sovereign Country  ',
        color: '#111111',
        autonomyTypeId: 'missing',
        powerRankTypeId: 'missing',
        overlordId: 'subjectCountry',
      },
      subjectCountry: {
        name: 'Subject Country',
        color: '#222222',
        autonomyTypeId: 'subject',
        powerRankTypeId: 'high',
        overlordId: 'sovereignCountry',
      },
    },
    countryOrder: ['subjectCountry'],
    powerBlocs: {
      bloc: {
        name: '  Example Bloc  ',
        leaderCountryId: 'sovereignCountry',
        memberCountryIds: [
          'sovereignCountry',
          'subjectCountry',
          'subjectCountry',
          'missingCountry',
        ],
      },
    },
    provinceAssignments: { 10: 'subjectCountry' },
  })

  assert.deepEqual(Object.keys(normalized.autonomyTypes).sort(), ['sovereign', 'subject'])
  assert.deepEqual(Object.keys(normalized.powerRankTypes).sort(), ['high', 'low'])
  assert.deepEqual(normalized.autonomyTypes.sovereign, {
    name: 'Sovereign',
    englishName: 'Sovereign',
    autonomy: 10,
  })
  assert.equal(normalized.autonomyTypes.subject.autonomy, 1)
  assert.equal(normalized.powerRankTypes.high.level, 10)
  assert.equal(normalized.powerRankTypes.low.level, 1)
  assert.deepEqual(normalized.countries.sovereignCountry, {
    name: 'Sovereign Country',
    color: '#111111',
    autonomyTypeId: 'sovereign',
    powerRankTypeId: 'low',
    overlordId: null,
  })
  assert.equal(normalized.countries.subjectCountry.overlordId, 'sovereignCountry')
  assert.deepEqual(normalized.countryOrder, ['subjectCountry', 'sovereignCountry'])
  assert.deepEqual(normalized.powerBlocs.bloc, {
    name: 'Example Bloc',
    leaderCountryId: 'sovereignCountry',
    memberCountryIds: ['subjectCountry'],
  })
  assert.deepEqual(normalized.provinceAssignments, { 10: 'subjectCountry' })
})
