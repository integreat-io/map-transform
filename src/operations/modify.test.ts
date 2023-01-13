import test from 'ava'
import { identity } from '../utils/functional.js'

import modify from './modify.js'

// Setup

const options = {}

// Tests

test('should fetch data from context with pipeline and merge with value', (t) => {
  const pipeline = '.'
  const items = [{ id: 'ent1', $type: 'entry' }]
  const state = {
    context: [],
    target: { status: 'ok', data: { items } },
    value: { data: items },
  }
  const expected = {
    ...state,
    value: { status: 'ok', data: items },
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge objects', (t) => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
    value: { name: 'John', meta: { count: 134 } },
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge objects in reverse', (t) => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
    value: { name: 'John', meta: { count: 134 } },
    rev: true,
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should shallow merge objects flipped and in reverse', (t) => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
    value: { name: 'John', meta: { count: 134 } },
    rev: true,
    flip: true,
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should support pipeline more complex than path', (t) => {
  const pipeline = { id: 'data.personal.id' }
  const state = {
    context: [],
    target: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
    value: { data: { name: 'John', meta: { count: 134 } } },
  }
  const expected = {
    ...state,
    value: { id: '1', data: { name: 'John', meta: { count: 134 } } },
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not merge when pipeline yields non-object', (t) => {
  const pipeline = 'data.value'
  const state = {
    context: [],
    target: { status: 'ok', data: { value: 32 } },
    value: { success: 'true' },
  }
  const expected = state

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not merge when value is a non-object', (t) => {
  const pipeline = 'data'
  const state = {
    context: [],
    target: { value: 32 },
    value: 16,
  }
  const expected = state

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined', (t) => {
  const pipeline = { data: '.' }
  const value = undefined
  const state = {
    context: [{ status: 'ok', data: { value } }, { value }],
    value: value,
  }
  const expected = {
    ...state,
    value: undefined,
  }

  const ret = modify(pipeline)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined for null when included in noneValues', (t) => {
  const optionsWithNullAsNone = { ...options, noneValues: [undefined, null] }
  const pipeline = { data: '.' }
  const value = null
  const state = {
    context: [{ status: 'ok', data: { value } }, { value }],
    value: value,
  }
  const expected = state

  const ret = modify(pipeline)(optionsWithNullAsNone)(identity)(state)

  t.deepEqual(ret, expected)
})
