import test from 'ava'

import { explode, implode } from './explode'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  onlyMapped: false,
  context: [],
  value: {},
}

// Tests -- explode

test('should explode object to array of key value objects', (t) => {
  const data = { NOK: 1, USD: 0.125, EUR: 0.1 }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]

  const ret = explode()(data, state)

  t.deepEqual(ret, expected)
})

test('should not explode properties with undefined value', (t) => {
  const data = { NOK: 1, USD: 0.125, EUR: undefined }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
  ]

  const ret = explode()(data, state)

  t.deepEqual(ret, expected)
})

test('should explode empty object to empty array', (t) => {
  const data = {}
  const expected: unknown[] = []

  const ret = explode()(data, state)

  t.deepEqual(ret, expected)
})

test('should explode array to array of key value objects', (t) => {
  const data = ['lock', 'stock', 'two smoking barrels']
  const expected = [
    { key: 0, value: 'lock' },
    { key: 1, value: 'stock' },
    { key: 2, value: 'two smoking barrels' },
  ]

  const ret = explode()(data, state)

  t.deepEqual(ret, expected)
})

test('should not explode non-objects', (t) => {
  t.deepEqual(explode()(undefined, state), undefined)
  t.deepEqual(explode()(null, state), undefined)
  t.deepEqual(explode()('The text', state), undefined)
  t.deepEqual(explode()(3, state), undefined)
  t.deepEqual(explode()(true, state), undefined)
  t.deepEqual(explode()(new Date(), state), undefined)
})

test('should implode array of key value objects to object in reverse', (t) => {
  const data = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]
  const expected = { NOK: 1, USD: 0.125, EUR: 0.1 }

  const ret = explode()(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should implode array of key value objects to array in reverse', (t) => {
  const data = [
    { key: 0, value: 'lock' },
    { key: 1, value: 'stock' },
    { key: 4, value: 'two smoking barrels' },
  ]
  const expected = [
    'lock',
    'stock',
    undefined,
    undefined,
    'two smoking barrels',
  ]

  const ret = explode()(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should skip non-object value when imploding in reverse', (t) => {
  const data = [
    { key: 'NOK', value: 1 },
    'String',
    8,
    true,
    new Date(),
    null,
    undefined,
    { key: 'EUR', value: 0.1 },
  ]
  const expected = { NOK: 1, EUR: 0.1 }

  const ret = explode()(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should not implode non-arrays in revers', (t) => {
  t.deepEqual(explode()(undefined, stateRev), undefined)
  t.deepEqual(explode()(null, stateRev), undefined)
  t.deepEqual(explode()('The text', stateRev), undefined)
  t.deepEqual(explode()(3, stateRev), undefined)
  t.deepEqual(explode()(true, stateRev), undefined)
  t.deepEqual(explode()(new Date(), stateRev), undefined)
})

// Tests -- implode

test('should implode array of key value objects to object ', (t) => {
  const data = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]
  const expected = { NOK: 1, USD: 0.125, EUR: 0.1 }

  const ret = implode()(data, state)

  t.deepEqual(ret, expected)
})

test('should implode empty array to empty object object ', (t) => {
  const data: unknown[] = []
  const expected = {}

  const ret = implode()(data, state)

  t.deepEqual(ret, expected)
})

test('should explode object to array of key value objects in reverse', (t) => {
  const data = { NOK: 1, USD: 0.125, EUR: 0.1 }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]

  const ret = implode()(data, stateRev)

  t.deepEqual(ret, expected)
})
