import test from 'ava'

import fixed from './fixed'

// Setup

const options = {}

// Tests

test('should set value', t => {
  const state = {
    root: {},
    context: {},
    value: 'Something'
  }
  const expected = {
    root: {},
    context: {},
    value: 'Splendid!'
  }

  const ret = fixed('Splendid!')(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value from function', t => {
  const state = {
    root: {},
    context: {},
    value: 'Something'
  }
  const expected = {
    root: {},
    context: {},
    value: 'Value from function'
  }
  const valueFunction = () => 'Value from function'

  const ret = fixed(valueFunction)(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value for onlyMapped too', t => {
  const state = {
    root: {},
    context: {},
    value: 'Something',
    onlyMapped: true
  }
  const expected = {
    root: {},
    context: {},
    value: 'Splendid!',
    onlyMapped: true
  }

  const ret = fixed('Splendid!')(options)(state)

  t.deepEqual(ret, expected)
})
