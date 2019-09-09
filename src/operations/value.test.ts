import test from 'ava'

import value from './value'

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

  const ret = value('Splendid!')(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value from a function', t => {
  const state = {
    root: {},
    context: {},
    value: 'Something'
  }
  const expected = {
    root: {},
    context: {},
    value: 'Default from function'
  }
  const valueFunction = () => 'Default from function'

  const ret = value(valueFunction)(options)(state)

  t.deepEqual(ret, expected)
})

test('should not set value when onlyMapped', t => {
  const state = {
    root: {},
    context: {},
    value: 'Something',
    onlyMapped: true
  }
  const expected = {
    root: {},
    context: {},
    value: undefined,
    onlyMapped: true
  }

  const ret = value('Splendid!')(options)(state)

  t.deepEqual(ret, expected)
})
