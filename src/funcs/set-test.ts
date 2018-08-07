import test from 'ava'
import get from './get'

import set from './set'

// Tests

test('should get value from context and set on path', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: { meta: { author: 'johnf' } }
  }
  const ret = set('meta.author', get('user'))(state)

  t.deepEqual(ret, expected)
})

test('should set on existing value', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: { meta: { sections: ['news'] } }
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: { meta: { author: 'johnf', sections: ['news'] } }
  }
  const ret = set('meta.author', get('user'))(state)

  t.deepEqual(ret, expected)
})

test('should get value from array and set on path', (t) => {
  const state = {
    root: [{ user: 'johnf' }, { user: 'maryk' }],
    context: [{ user: 'johnf' }, { user: 'maryk' }],
    value: undefined
  }
  const expectedValue = [
    { meta: { author: 'johnf' } },
    { meta: { author: 'maryk' } }
  ]

  const ret = set('meta.author', get('user'))(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set undefined', (t) => {
  const state = {
    root: {},
    context: {},
    value: undefined
  }
  const expected = {
    root: {},
    context: {},
    value: { meta: { author: undefined } }
  }
  const ret = set('meta.author', get('user'))(state)

  t.deepEqual(ret, expected)
})
