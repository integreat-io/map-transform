import test from 'node:test'
import assert from 'node:assert/strict'

import index from './indexFn.js'

// Setup

const data = { id: 'ent1', $type: 'entry' }

const state = {
  noDefaults: false,
  context: [],
  value: {},
  rev: false,
}

const options = {}

// Test

test('should return index from state', async () => {
  const stateWithIndex = {
    ...state,
    index: 5,
  }

  const ret = await index({})(options)(data, stateWithIndex)

  assert.equal(ret, 5)
})

test('should return 0 when state has no index', async () => {
  const ret = await index({})(options)(data, state)

  assert.equal(ret, 0)
})
