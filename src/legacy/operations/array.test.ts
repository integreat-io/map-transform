import test from 'node:test'
import assert from 'node:assert/strict'
import { get } from './getSet.js'
import { noopNext } from '../utils/stateHelpers.js'

import array from './array.js'

// Helpers

const options = {}

// Tests

test('should generate an array from the given pipelines', async () => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
  }
  const expected = {
    context: [],
    value: ['John F.', 'johnf'],
    flip: false,
  }

  const ret = await array({ pipelines: [def1, def2] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should keep undefined', async () => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [],
    value: [undefined, 'johnf'],
    flip: false,
  }

  const ret = await array({ pipelines: [def1, def2] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return empty array when no pipelines', async () => {
  const state = {
    context: [],
    value: { id: 'johnf' },
  }
  const expected = {
    context: [],
    value: [],
  }

  const ret = await array({ pipelines: [] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should support parent in pipeline', async () => {
  const def1 = get('^.name')
  const def2 = get('title')
  const state = {
    context: [{ id: 'ent1', name: 'Parent name', props: { title: 'Entry 1' } }],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [{ id: 'ent1', name: 'Parent name', props: { title: 'Entry 1' } }],
    value: ['Parent name', 'Entry 1'],
    flip: false,
  }

  const ret = await array({ pipelines: [def1, def2] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should generate an array from the given pipelines when flipped in reverse', async () => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
    rev: true,
  }
  const expected = {
    context: [],
    value: ['John F.', 'johnf'],
    rev: true,
    flip: true,
  }

  const ret = await array({ pipelines: [def1, def2], flip: true })(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible in reverse', async () => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: ['John F.', 'johnf'],
    rev: true,
  }
  const expected = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
    rev: true,
    flip: false,
  }

  const ret = await array({ pipelines: [def1, def2] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible when flipped going forward', async () => {
  const def1 = get('name')
  const def2 = get('id')
  const state = {
    context: [],
    value: ['John F.', 'johnf'],
  }
  const expected = {
    context: [],
    value: { id: 'johnf', name: 'John F.' },
    flip: true,
  }

  const ret = await array({ pipelines: [def1, def2], flip: true })(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when no pipelines in reverse', async () => {
  const state = {
    context: [],
    value: ['John F.', 'johnf'],
    rev: true,
  }
  const expected = {
    context: [],
    value: undefined,
    rev: true,
  }

  const ret = await array({ pipelines: [] })(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})
