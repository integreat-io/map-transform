import test from 'ava'
import { identity } from '../utils/functional.js'

import plug from './plug.js'

// Setup

const options = {}

// Tests

test('should set value to undefined', (t) => {
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
  }
  const expected = {
    context: [],
    value: undefined,
  }

  const ret = plug()(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when noDefaults', (t) => {
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

  const ret = plug()(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set target as value when present', (t) => {
  const state = {
    context: [],
    target: { data: { name: 'John F.', age: 32 } },
    value: { data: { name: 'John F.' } },
  }
  const expected = {
    ...state,
    value: { data: { name: 'John F.', age: 32 } },
  }

  const ret = plug()(options)(identity)(state)

  t.deepEqual(ret, expected)
})
