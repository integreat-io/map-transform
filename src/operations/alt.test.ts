import test from 'ava'
import { get } from './getSet'
import iterate from './iterate'
import pipe from './pipe'
import value from './value'
import { identity } from '../utils/functional'

import alt from './alt'

// Helpers

const options = {}

// Tests

test('should use alternative operation when first yields undefined', (t) => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [{ id: 'johnf' }],
    value: 'johnf',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use first operation when it yields a value', (t) => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
  }
  const expected = {
    context: [{ id: 'johnf', name: 'John F.' }],
    value: 'John F.',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use third operation when the first two yields undefined', (t) => {
  const def1 = get('name')
  const def2 = get('nickname')
  const def3 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [{ id: 'johnf' }],
    value: 'johnf',
  }

  const ret = pipe(alt(def1, def2, def3))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should yield alt value from a dot path', (t) => {
  const def1 = get('id')
  const def2 = get('meta.cid')
  const state = {
    context: [],
    value: { meta: { cid: '12345' } },
  }
  const expected = {
    context: [{ meta: { cid: '12345' } }, { cid: '12345' }],
    value: '12345',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not polute context from unyielding operations', (t) => {
  const def1 = get('meta.cid')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: '12345', meta: { create: 1661193390742 } },
  }
  const expected = {
    context: [{ id: '12345', meta: { create: 1661193390742 } }],
    value: '12345',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat path as an operation', (t) => {
  const def1 = get('name')
  const def2 = 'id'
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [{ id: 'johnf' }],
    value: 'johnf',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use value from value operation', (t) => {
  const def1 = get('name')
  const def2 = value('No user')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [], // TODO: value() should push to context
    value: 'No user',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat transform pipeline as an operation', (t) => {
  const def1 = get('name')
  const def2 = ['id']
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expectedValue = 'johnf'

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.is(ret.value, expectedValue)
})

test('should treat array as a value and not iterate', (t) => {
  const def1 = 'names'
  const def2 = 'id'
  const state = {
    context: [],
    value: { id: 'johnf', names: ['John F.', 'The John'] },
  }
  const expectedValue = ['John F.', 'The John']

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should support set on first path in reverse, and set default value', (t) => {
  const def1 = get('name')
  const def2 = get('meta.id')
  const def3 = value('No user')
  const state = {
    context: [{ meta: { created: 1661193390742 } }],
    value: undefined,
    rev: true,
  }
  const expected = {
    context: [], // TODO: value() should push to context
    value: { name: 'No user' },
    rev: true,
  }

  const ret = pipe(alt(def1, def2, def3))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should support noneValues from options', (t) => {
  const optionsWithNullAsNoValue = { ...options, noneValues: [undefined, null] }
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf', name: null },
  }
  const expectedValue = 'johnf'

  const ret = pipe(alt(def1, def2))(optionsWithNullAsNoValue)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should behave correctly when iterated', (t) => {
  const def1 = 'name'
  const def2 = 'id'
  const state = {
    context: [],
    value: [{ id: 'admin' }, { id: 'johnf', name: 'John F.' }],
  }
  const expectedValue = ['admin', 'John F.']

  const ret = iterate(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})
