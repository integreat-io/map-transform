import test from 'ava'
import State from './state.js'

import { createDataMapper } from './createDataMapper.js'

// Tests -- sync

test('should create mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const options = {}

  const ret = createDataMapper(def, options)

  t.is(typeof ret, 'function')
})

test('should map data with created mapper', (t) => {
  const def = { id: 'key', title: 'name' }
  const value = { key: 'ent1', name: 'Entry 1' }
  const state = new State()
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = createDataMapper(def, options)(value, state)

  t.deepEqual(ret, expected)
})

test('should use context provided in state', (t) => {
  const def = ['^', { id: 'key', title: 'name' }]
  const value = 'Entry 1'
  const context = [{ key: 'ent1', name: 'Entry 1' }]
  const state = new State()
  state.replaceContext(context)
  const options = {}
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = createDataMapper(def, options)(value, state)

  t.deepEqual(ret, expected)
})
