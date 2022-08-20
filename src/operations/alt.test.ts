import test from 'ava'
import iterate from './iterate'
import { get } from './getSet'
import { identity } from '../utils/functional'

import alt from './alt'

// Helpers

const options = {}

// Tests

test('should set alt value when value is undefined', (t) => {
  const def = get('user')
  const state = {
    context: [{ user: 'johnf' }],
    value: undefined,
  }
  const expected = {
    context: [{ user: 'johnf' }],
    value: 'johnf',
  }

  const ret = alt(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when value is set', (t) => {
  const def = get('user')
  const state = {
    context: [{ user: 'johnf' }],
    value: 'maryk',
  }
  const expected = {
    context: [{ user: 'johnf' }],
    value: 'maryk',
  }

  const ret = alt(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set alt value from a dot path', (t) => {
  const def = get('meta.user')
  const state = {
    context: [{ meta: { user: 'johnf' } }],
    value: undefined,
  }
  const expected = {
    context: [{ meta: { user: 'johnf' } }, { user: 'johnf' }],
    value: 'johnf',
  }

  const ret = alt(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set alt value when value is one of the supplied undefined values', (t) => {
  const def = get('user')
  const state = {
    context: [{ user: 'johnf' }],
    value: null,
  }
  const expected = {
    context: [{ user: 'johnf' }],
    value: 'johnf',
  }
  const undefinedValues = [undefined, null]

  const ret = alt(def, undefinedValues)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should unescape **undefined**', (t) => {
  const def = get('user')
  const state = {
    context: [{ user: 'johnf' }],
    value: undefined,
  }
  const expected = {
    context: [{ user: 'johnf' }],
    value: 'johnf',
  }
  const undefinedValues = ['**undefined**', null]

  const ret = alt(def, undefinedValues)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should accept path', (t) => {
  const def = 'user'
  const state = {
    context: [{ user: 'johnf' }],
    value: undefined,
  }
  const expectedValue = 'johnf'

  const ret = alt(def)(options)(identity)(state)

  t.is(ret.value, expectedValue)
})

test('should accept transform pipeline', (t) => {
  const def = ['user']
  const state = {
    context: [{ user: 'johnf' }],
    value: undefined,
  }
  const expectedValue = 'johnf'

  const ret = alt(def)(options)(identity)(state)

  t.is(ret.value, expectedValue)
})

test('should treat array as a value and not iterate', (t) => {
  const def = 'user'
  const state = {
    context: [{ user: 'johnf' }],
    value: ['maryk', undefined],
  }
  const expectedValue = ['maryk', undefined]

  const ret = alt(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test.failing('should behave correctly when iterated', (t) => {
  const def = 'user'
  const state = {
    context: [[{ user: 'admin' }, { user: 'johnf' }]],
    value: ['maryk', undefined],
  }
  const expectedValue = ['maryk', 'johnf']

  const ret = iterate(alt(def))(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})
