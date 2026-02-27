import test from 'node:test'
import assert from 'node:assert/strict'

import { explode, implode } from './explode.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests -- explode

test('should explode object to array of key value objects', async () => {
  const data = { NOK: 1, USD: 0.125, EUR: 0.1 }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]

  const ret = await explode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should not explode properties with undefined value', async () => {
  const data = { NOK: 1, USD: 0.125, EUR: undefined }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
  ]

  const ret = await explode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should explode empty object to empty array', async () => {
  const data = {}
  const expected: unknown[] = []

  const ret = await explode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should explode array to array of key value objects', async () => {
  const data = ['lock', 'stock', 'two smoking barrels']
  const expected = [
    { key: 0, value: 'lock' },
    { key: 1, value: 'stock' },
    { key: 2, value: 'two smoking barrels' },
  ]

  const ret = await explode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should not explode non-objects', async () => {
  assert.deepEqual(await explode({})(options)(undefined, state), undefined)
  assert.deepEqual(await explode({})(options)(null, state), undefined)
  assert.deepEqual(await explode({})(options)('The text', state), undefined)
  assert.deepEqual(await explode({})(options)(3, state), undefined)
  assert.deepEqual(await explode({})(options)(true, state), undefined)
  assert.deepEqual(await explode({})(options)(new Date(), state), undefined)
})

test('should implode array of key value objects to object in reverse', async () => {
  const data = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]
  const expected = { NOK: 1, USD: 0.125, EUR: 0.1 }

  const ret = await explode({})(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should implode array of key value objects to array in reverse', async () => {
  const data = [
    { key: 0, value: 'lock' },
    { key: 1, value: 'stock' },
    { key: 4, value: 'two smoking barrels' },
  ]
  // eslint-disable-next-line no-sparse-arrays
  const expected = ['lock', 'stock', , , 'two smoking barrels']

  const ret = await explode({})(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should skip non-object value when imploding in reverse', async () => {
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

  const ret = await explode({})(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should not implode non-arrays in revers', async () => {
  assert.deepEqual(await explode({})(options)(undefined, stateRev), undefined)
  assert.deepEqual(await explode({})(options)(null, stateRev), undefined)
  assert.deepEqual(await explode({})(options)('The text', stateRev), undefined)
  assert.deepEqual(await explode({})(options)(3, stateRev), undefined)
  assert.deepEqual(await explode({})(options)(true, stateRev), undefined)
  assert.deepEqual(await explode({})(options)(new Date(), stateRev), undefined)
})

// Tests -- implode

test('should implode array of key value objects to object ', async () => {
  const data = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]
  const expected = { NOK: 1, USD: 0.125, EUR: 0.1 }

  const ret = await implode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should implode empty array to empty object object ', async () => {
  const data: unknown[] = []
  const expected = {}

  const ret = await implode({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should explode object to array of key value objects in reverse', async () => {
  const data = { NOK: 1, USD: 0.125, EUR: 0.1 }
  const expected = [
    { key: 'NOK', value: 1 },
    { key: 'USD', value: 0.125 },
    { key: 'EUR', value: 0.1 },
  ]

  const ret = await implode({})(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})
