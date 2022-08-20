import test from 'ava'
import { identity } from '../utils/functional'

import plug from './plug'

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

test('should set value to undefined when onlyMapped', (t) => {
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
    onlyMapped: true,
  }
  const expected = {
    context: [],
    value: undefined,
    onlyMapped: true,
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
