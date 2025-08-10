import test from 'node:test'
import assert from 'node:assert/strict'
import State from './state.js'

import { createDataMapper, createDataMapperAsync } from './createDataMapper.js'

// Tests -- sync

test('should create mapper', () => {
  const def = { id: 'key', title: 'name' }
  const options = {}

  const ret = createDataMapper(def, options)

  assert.equal(typeof ret, 'function')
})

test('should map data with created mapper', () => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = new State()
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = createDataMapper(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should use context provided in state', () => {
  const def = ['^', { id: 'key', title: 'name' }]
  const value = 'Entry 1'
  const context = [{ key: 'ent1', name: 'Entry 1' }]
  const state = new State({ context })
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = createDataMapper(def, options)(value, state)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should create async mapper', async () => {
  const fn = () => () => async () => 'From async'
  const def = { id: 'key', title: 'name', asyncValue: { $transform: 'async' } }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = new State()
  const options = { transformers: { async: fn } }
  const expected = { id: 'ent1', title: 'Entry 1', asyncValue: 'From async' }

  const ret = await createDataMapperAsync(def, options)(value, state)

  assert.deepEqual(ret, expected)
})
