import test from 'ava'
import iterate from './iterate'
import { get } from './getSet'

import alt from './alt'

// Helpers

const options = {}

// Tests

test('should set alt value when value is undefined', t => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'johnf'
  }

  const ret = alt(get('user'))(options)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when value is set', t => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'maryk'
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'maryk'
  }

  const ret = alt(get('user'))(options)(state)

  t.deepEqual(ret, expected)
})

test('should accept path', t => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expectedValue = 'johnf'

  const ret = alt('user')(options)(state)

  t.is(ret.value, expectedValue)
})

test('should accept transform pipeline', t => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expectedValue = 'johnf'

  const ret = alt(['user'])(options)(state)

  t.is(ret.value, expectedValue)
})

test('should treat array as a value and not iterate', t => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: ['maryk', undefined]
  }
  const expectedValue = ['maryk', undefined]

  const ret = alt('user')(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should behave correctly when iterated', t => {
  const state = {
    root: [{ user: 'admin' }, { user: 'johnf' }],
    context: [{ user: 'admin' }, { user: 'johnf' }],
    value: ['maryk', undefined]
  }
  const expectedValue = ['maryk', 'johnf']

  const ret = iterate(alt('user'))(options)(state)

  t.deepEqual(ret.value, expectedValue)
})
