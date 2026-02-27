import test from 'node:test'
import assert from 'node:assert/strict'

import get from './get.js'

// Setup

const data = {
  title: 'Heading 1',
  meta: { user: 'johnf' },
}

const arrayData = ['first', 'second', 'third']

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Test

test('should return value at given path', () => {
  const path = 'meta.user'
  const expected = 'johnf'

  const ret = get({ path })(options)(data, state)

  assert.equal(ret, expected)
})

test('should return pipeline value when no path', () => {
  const data = 'johnf'
  const expected = 'johnf'

  const ret = get({})(options)(data, state)

  assert.equal(ret, expected)
})

test('should return undefined for unknown path', () => {
  const path = 'meta.missing'

  const ret = get({ path })(options)(data, state)

  assert.equal(ret, undefined)
})

test('should return item at given array index', () => {
  const path = '[1]'
  const expected = 'second'

  const ret = get({ path })(options)(arrayData, state)

  assert.equal(ret, expected)
})

test('should return the last item', () => {
  const path = '[-1]'

  const ret = get({ path })(options)(arrayData, state)

  assert.equal(ret, 'third')
})

test('should return undefined when index is too high', () => {
  const path = '[3]'

  const ret = get({ path })(options)(arrayData, state)

  assert.equal(ret, undefined)
})

test('should return undefined when data is not an array', () => {
  const path = '[1]'

  const ret = get({ path })(options)(data, state)

  assert.equal(ret, undefined)
})

test('should support root in path', () => {
  const path = '^^meta.user'
  const data = { id: 'ent1', $type: 'entry' }
  const state = {
    context: [{ data: [data], meta: { user: 'maryk' } }, [data]],
    value: data,
    rev: false,
    noDefaults: false,
  }
  const expected = 'maryk'

  const ret = get({ path })(options)(data, state)

  assert.equal(ret, expected)
})

test('should throw when path is a pipeline', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = ['meta.user', { $transform: 'string' }] as any
  const expectedError = new TypeError(
    "The 'get' transformer does not allow `path` to be a pipeline",
  )

  assert.throws(() => get({ path })(options)(data, state), expectedError)
})
