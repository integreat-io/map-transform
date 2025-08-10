import test from 'node:test'
import assert from 'node:assert/strict'

import flatten from './flatten.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should flatten an array', async () => {
  const data = [[{ id: 'ent1' }, { id: 'ent2' }], [{ id: 'ent3' }]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = await flatten({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should flatten a flat array (i.e. do nothing)', async () => {
  const data = [{ id: 'ent1' }, { id: 'ent2' }]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = await flatten({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should only flatten one level of an array', async () => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [[{ id: 'ent1' }], { id: 'ent2' }, [{ id: 'ent3' }]]

  const ret = await flatten({})(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should only flatten more levels of an array', async () => {
  const data = [[[{ id: 'ent1' }], { id: 'ent2' }], [[{ id: 'ent3' }]]]
  const expected = [{ id: 'ent1' }, { id: 'ent2' }, { id: 'ent3' }]

  const ret = await flatten({ depth: 2 })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should not touch non-arrays', async () => {
  assert.equal(await flatten({})(options)('none', state), 'none')
  assert.equal(await flatten({})(options)(true, state), true)
  assert.deepEqual(await flatten({})(options)({}, state), {})
  assert.equal(await flatten({})(options)(null, state), null)
  assert.equal(await flatten({})(options)(undefined, state), undefined)
})
