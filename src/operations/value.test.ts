import test from 'ava'
import sinon = require('sinon')
import { identity } from '../utils/functional'

import value from './value'

// Setup

const options = {}

// Tests

test('should set value', (t) => {
  const state = {
    context: [{}],
    value: 'Something',
  }
  const expected = {
    context: [{}],
    value: 'Splendid!',
  }

  const ret = value('Splendid!')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set value from a function', (t) => {
  const state = {
    context: [{}],
    value: 'Something',
  }
  const expected = {
    context: [{}],
    value: 'Default from function',
  }
  const valueFunction = () => 'Default from function'

  const ret = value(valueFunction)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not set value when onlyMapped', (t) => {
  const state = {
    context: [{}],
    value: 'Something',
    onlyMapped: true,
  }
  const expected = {
    context: [{}],
    value: undefined,
    onlyMapped: true,
  }

  const ret = value('Splendid!')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not call next', (t) => {
  const next = sinon.stub()
  const state = {
    context: [{}],
    value: 'Something',
  }

  value('Splendid!')(options)(next)(state)

  t.is(next.callCount, 0)
})

test.todo('should push value to context when setting new value')
