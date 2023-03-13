import test from 'ava'
import { get } from './getSet.js'
import iterate from './iterate.js'
import pipe from './pipe.js'
import transform from './transform.js'
import { value } from '../transformers/value.js'
import { identity } from '../utils/functional.js'

import alt from './alt.js'

// Helpers

const options = {}

// Tests -- several pipelines

test('should use alternative pipeline when first yields undefined', (t) => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [],
    value: 'johnf',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use first pipeline when it yields a value', (t) => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
  }
  const expected = {
    context: [],
    value: 'John F.',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should use third pipeline when the first two yields undefined', (t) => {
  const def1 = get('name')
  const def2 = get('nickname')
  const def3 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [],
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
    context: [],
    value: '12345',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not polute context from unyielding pipeline', (t) => {
  const def1 = get('title')
  const def2 = get('content.heading')
  const def3 = get('headline')
  const data = { headline: 'Entry 1', user: 'johnf', content: {} }
  const state = {
    context: [{ data }],
    value: data,
  }
  const expected = {
    context: [{ data }],
    value: 'Entry 1',
  }

  const ret = pipe(alt(def1, def2, def3))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat path as an pipeline', (t) => {
  const def1 = get('name')
  const def2 = 'id'
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [],
    value: 'johnf',
  }

  const ret = pipe(alt(def1, def2))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should support transform pipeline', (t) => {
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
  const def3 = transform(value('No user'))
  const state = {
    context: [{ meta: { created: 1661193390742 } }],
    value: undefined,
    rev: true,
  }
  const expected = {
    context: [{ meta: { created: 1661193390742 } }],
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

// Tests -- one pipeline

test('should run if value is undefined when only one pipeline', (t) => {
  const def = get('id')
  const state = {
    context: [{ id: 'johnf' }],
    value: undefined,
  }
  const expected = {
    context: [{ id: 'johnf' }],
    value: 'johnf',
  }

  const ret = pipe(alt(def))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not run if value is not undefined when only one pipeline', (t) => {
  const def = get('id')
  const state = {
    context: [{ name: 'John F.' }],
    value: 'John F.',
  }
  const expected = {
    context: [{ name: 'John F.' }],
    value: 'John F.',
  }

  const ret = pipe(alt(def))(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run if value is null when included in noneValues only one pipeline', (t) => {
  const optionsWithNullAsNoValue = { ...options, noneValues: [undefined, null] }
  const def = get('id')
  const state = {
    context: [{ id: 'johnf' }],
    value: null,
  }
  const expected = {
    context: [{ id: 'johnf' }],
    value: 'johnf',
  }

  const ret = pipe(alt(def))(optionsWithNullAsNoValue)(identity)(state)

  t.deepEqual(ret, expected)
})
