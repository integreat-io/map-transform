import test from 'ava'

import index from './indexFn'

// Setup

const data = { id: 'ent1', $type: 'entry' }

const state = {
  onlyMapped: false,
  context: [],
  value: {},
  rev: false,
}

// Test

test('should return index from state', (t) => {
  const stateWithIndex = {
    ...state,
    index: 5,
  }

  const ret = index()(data, stateWithIndex)

  t.is(ret, 5)
})

test('should return 0 when state has no index', (t) => {
  const ret = index()(data, state)

  t.is(ret, 0)
})
