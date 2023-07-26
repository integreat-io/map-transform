import test from 'ava'

import not from './not.js'

// Setup

const returnIt = () => async (value: unknown) => !!value
const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should return true for false', async (t) => {
  const data = false

  const ret = await not(returnIt)(options)(data, state)
  t.true(ret)
})

test('should return false for true', async (t) => {
  const data = true

  const ret = await not(returnIt)(options)(data, state)
  t.false(ret)
})

test('should return true for false from a path', async (t) => {
  const data = { visible: false }
  const path = 'visible'

  const ret = await not({ path })(options)(data, state)

  t.true(ret)
})
