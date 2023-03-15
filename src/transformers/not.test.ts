import test from 'ava'

import not from './not.js'

// Setup

const returnIt = (value: unknown) => !!value
const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

// Tests

test('should return true for false', (t) => {
  const data = false

  const ret = not(returnIt)(data, state)
  t.true(ret)
})

test('should return false for true', (t) => {
  const data = true

  const ret = not(returnIt)(data, state)
  t.false(ret)
})
