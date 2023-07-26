import test from 'ava'

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

test('should return index from state', async (t) => {
  const stateWithIndex = {
    ...state,
    index: 5,
  }

  const ret = await index({})(options)(data, stateWithIndex)

  t.is(ret, 5)
})

test('should return 0 when state has no index', async (t) => {
  const ret = await index({})(options)(data, state)

  t.is(ret, 0)
})
