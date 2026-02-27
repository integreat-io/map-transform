import test from 'node:test'
import assert from 'node:assert/strict'

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

test('should return true for false', async () => {
  const data = false

  const ret = await not(returnIt)(options)(data, state)
  assert.equal(ret, true)
})

test('should return false for true', async () => {
  const data = true

  const ret = await not(returnIt)(options)(data, state)
  assert.equal(ret, false)
})

test('should return true for false from a path', async () => {
  const data = { visible: false }
  const path = 'visible'

  const ret = await not({ path })(options)(data, state)

  assert.equal(ret, true)
})
