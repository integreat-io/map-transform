import test from 'ava'
import { noopNext } from '../utils/stateHelpers.js'

import plug from './plug.js'

// Setup

const options = {}

// Tests

test('should set value to undefined', async (t) => {
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
  }
  const expected = {
    context: [],
    value: undefined,
  }

  const ret = await plug()(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when noDefaults', async (t) => {
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
    noDefaults: true,
  }
  const expected = {
    context: [],
    value: undefined,
    noDefaults: true,
  }

  const ret = await plug()(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set target as value when present', async (t) => {
  const state = {
    context: [],
    target: { data: { name: 'John F.', age: 32 } },
    value: { data: { name: 'John F.' } },
  }
  const expected = {
    ...state,
    value: { data: { name: 'John F.', age: 32 } },
  }

  const ret = await plug()(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})
