import test from 'ava'
import State from '../state.js'

import { not, notAsync } from './notNext.js'

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

test('should get value from pipeline', (t) => {
  const value = { visible: false }
  const path = 'visible'
  const expected = true

  const ret = not({ path })(options)(value, state)

  t.is(ret, expected)
})

test('should get value from async pipeline', async (t) => {
  const isFalse = async () => false
  const value = { id: 'ent1' }
  const path = [{ $transform: 'isFalse' }]
  const options = { transformers: { isFalse: () => () => isFalse } }
  const expected = true

  const ret = await notAsync({ path })(options)(value, state)

  t.is(ret, expected)
})
