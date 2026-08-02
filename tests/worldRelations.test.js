import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getAutomaticBlocMemberIds,
  getTopIndependentCountryId,
  isEligiblePowerBlocLeader,
  wouldCreateOverlordCycle,
} from '../src/map/worldRelations.js'

const autonomyTypes = {
  independent: { autonomy: 10 },
  subject: { autonomy: 5 },
}

const powerRankTypes = {
  leader: { level: 7 },
  minor: { level: 6 },
}

const countries = {
  root: {
    autonomyTypeId: 'independent',
    powerRankTypeId: 'leader',
    overlordId: null,
  },
  subject: {
    autonomyTypeId: 'subject',
    powerRankTypeId: 'minor',
    overlordId: 'root',
  },
  nestedSubject: {
    autonomyTypeId: 'subject',
    powerRankTypeId: 'minor',
    overlordId: 'subject',
  },
  rival: {
    autonomyTypeId: 'independent',
    powerRankTypeId: 'minor',
    overlordId: null,
  },
}

test('wouldCreateOverlordCycle rejects self and descendant overlords', () => {
  assert.equal(wouldCreateOverlordCycle('root', 'root', countries), true)
  assert.equal(wouldCreateOverlordCycle('root', 'nestedSubject', countries), true)
  assert.equal(wouldCreateOverlordCycle('subject', 'rival', countries), false)
  assert.equal(wouldCreateOverlordCycle('subject', null, countries), false)
})

test('wouldCreateOverlordCycle rejects an already-cyclic overlord chain', () => {
  const countriesWithCycle = {
    ...countries,
    loopA: { overlordId: 'loopB' },
    loopB: { overlordId: 'loopA' },
  }

  assert.equal(wouldCreateOverlordCycle('root', 'loopA', countriesWithCycle), true)
})

test('isEligiblePowerBlocLeader enforces independence and rank threshold', () => {
  assert.equal(
    isEligiblePowerBlocLeader(countries.root, autonomyTypes, powerRankTypes),
    true,
  )
  assert.equal(
    isEligiblePowerBlocLeader(countries.subject, autonomyTypes, powerRankTypes),
    false,
  )
  assert.equal(
    isEligiblePowerBlocLeader(countries.rival, autonomyTypes, powerRankTypes),
    false,
  )
  assert.equal(isEligiblePowerBlocLeader(undefined, autonomyTypes, powerRankTypes), false)
})

test('independent-country traversal includes nested automatic bloc members', () => {
  assert.equal(
    getTopIndependentCountryId('nestedSubject', countries, autonomyTypes),
    'root',
  )
  assert.deepEqual(
    getAutomaticBlocMemberIds('root', countries, autonomyTypes),
    new Set(['subject', 'nestedSubject']),
  )
})
