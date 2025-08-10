import test from 'node:test'
import assert from 'node:assert/strict'
import { noopNext } from '../utils/stateHelpers.js'

import modify from './modify.js'

// Setup

const options = {}

// Tests -- forward

test('should shallow merge object from pipeline with target', async () => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: { name: 'John', meta: { count: 134 } },
    value: {
      data: { personal: { id: '1', name: 'John F.' } },
    },
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should shallow merge objects flipped and in reverse', async () => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: { name: 'John', meta: { count: 134 } },
    value: {
      data: { personal: { id: '1', name: 'John F.' } },
    },
    rev: true,
    flip: true,
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should support pipeline more complex than path', async () => {
  const pipeline = { id: 'data.personal.id' }
  const state = {
    context: [],
    target: { data: { name: 'John', meta: { count: 134 } } },
    value: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
  }
  const expected = {
    ...state,
    value: { id: '1', data: { name: 'John', meta: { count: 134 } } },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not merge when pipeline yields non-object', async () => {
  const pipeline = 'data.value'
  const state = {
    context: [],
    target: { status: 'ok', data: { value: 32 } },
    value: { success: 'true' },
  }
  const expected = {
    ...state,
    value: { status: 'ok', data: { value: 32 } },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should use value when target is undefined', async () => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: undefined,
    value: {
      data: { personal: { id: '1', name: 'John F.' } },
    },
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John F.' },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not merge when value is a non-object', async () => {
  const pipeline = 'data'
  const state = {
    context: [],
    target: { value: 32 },
    value: 16,
  }
  const expected = {
    ...state,
    value: { value: 32 },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not mutate undefined', async () => {
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

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return undefined for null when included in nonvalues', async () => {
  const optionsWithNullAsNone = { ...options, nonvalues: [undefined, null] }
  const pipeline = { data: '.' }
  const value = null
  const state = {
    context: [{ status: 'ok', data: { value } }, { value }],
    value: value,
  }
  const expected = {
    ...state,
    value: undefined,
  }

  const ret = await modify(pipeline)(optionsWithNullAsNone)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

// Tests -- reverse

test('should shallow merge objects in reverse', async () => {
  const pipeline = 'data.personal'
  const state = {
    context: [],
    target: { name: 'John', meta: { count: 134 } },
    value: {
      data: { personal: { id: '1', name: 'John F.', meta: { viewed: 134 } } },
    },
    rev: true,
  }
  const expected = {
    ...state,
    value: { id: '1', name: 'John', meta: { count: 134 } },
  }

  const ret = await modify(pipeline)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})
