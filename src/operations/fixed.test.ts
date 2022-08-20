import test from 'ava'
import { identity } from '../utils/functional'

import fixed from './fixed'

// Setup

const options = {}

// Tests

test('should set value', (t) => {
  const state = {
    context: [],
    value: 'Something',
  }
  const expected = {
    context: [],
    value: 'Splendid!',
  }

  const ret = fixed('Splendid!')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set value from function', (t) => {
  const state = {
    context: [],
    value: 'Something',
  }
  const expected = {
    context: [],
    value: 'Value from function',
  }
  const valueFunction = () => 'Value from function'

  const ret = fixed(valueFunction)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set value for onlyMapped too', (t) => {
  const state = {
    context: [],
    value: 'Something',
    onlyMapped: true,
  }
  const expected = {
    context: [],
    value: 'Splendid!',
    onlyMapped: true,
  }

  const ret = fixed('Splendid!')(options)(identity)(state)

  t.deepEqual(ret, expected)
})
