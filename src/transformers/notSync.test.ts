import test from 'ava'
import State from '../state.js'

import not from './notSync.js'

// Setup

const options = {}
const state = new State()

// Tests

test('should return true for false', (t) => {
  const value = false
  const expected = true

  const ret = not({})(options)(value, state)

  t.is(ret, expected)
})

test('should return false for true', (t) => {
  const value = true
  const expected = false

  const ret = not({})(options)(value, state)

  t.is(ret, expected)
})

test('should return true for falsy', (t) => {
  const value = null
  const expected = true

  const ret = not({})(options)(value, state)

  t.is(ret, expected)
})

test('should return false for truthy', (t) => {
  const value = 'true'
  const expected = false

  const ret = not({})(options)(value, state)

  t.is(ret, expected)
})
