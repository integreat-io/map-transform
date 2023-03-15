import test from 'ava'

import not from './not.js'

// Setup

const returnIt = () => (value: unknown) => !!value
const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should return true for false', (t) => {
  const data = false

  const ret = not(returnIt)(options)(data, state)
  t.true(ret)
})

test('should return false for true', (t) => {
  const data = true

  const ret = not(returnIt)(options)(data, state)
  t.false(ret)
})

test('should return true for false from a path', (t) => {
  const data = { visible: false }
  const path = 'visible'

  const ret = not({ path })(options)(data, state)
  t.true(ret)
})
