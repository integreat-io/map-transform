import test from 'ava'

import mapTransform from './mapTransformSync.js'

// Tests

test('should create mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const options = {}

  const ret = mapTransform(def, options)

  t.is(typeof ret, 'function')
})

test('should map data with created mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = {}
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

// TODO: Will need sync versions of transformers
test.failing('should include built-in transformers', (t) => {
  const def = {
    id: 'key',
    title: 'name',
    active: ['archived', { $transform: 'not' }],
  }
  const value = { key: 'ent1', name: 'Entry 1', archived: true }
  const state = {}
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1', active: false }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should pass on nonvalues to the run function', (t) => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: '' }
  const state = {}
  const options = { nonvalues: [undefined, ''] }
  const expected = { id: 'ent1' }

  const ret = mapTransform(def, options)(value, state)

  t.deepEqual(ret, expected)
})
