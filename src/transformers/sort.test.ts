import test from 'node:test'
import assert from 'node:assert/strict'

import sort from './sort.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests

test('should sort numbers in ascending order', () => {
  const data = [5, 3, 15]
  const expected = [3, 5, 15]

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort strings in ascending order', () => {
  const data = ['John', 'Alice', 'Bob']
  const expected = ['Alice', 'Bob', 'John']

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort booleans in ascending order', () => {
  const data = [true, false, true]
  const expected = [false, true, true]

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort dates in ascending order', () => {
  const data = [
    new Date('2020-09-11T00:00:00Z'),
    new Date('2022-03-04T18:43:11Z'),
    new Date('2021-11-04T17:39:38Z'),
  ]
  const expected = [
    new Date('2020-09-11T00:00:00Z'),
    new Date('2021-11-04T17:39:38Z'),
    new Date('2022-03-04T18:43:11Z'),
  ]

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort null and undefined last', () => {
  const data = [null, 5, 'zero', undefined, 3, 'Alice', 15, 'Bob']
  const expected = [3, 5, 15, 'Alice', 'Bob', 'zero', null, undefined]

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort numbers in descending order', () => {
  const data = [5, 3, 15]
  const expected = [15, 5, 3]

  const ret = sort({ asc: false })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort strings in descending order', () => {
  const data = ['John', 'Alice', 'Bob']
  const expected = ['John', 'Bob', 'Alice']

  const ret = sort({ asc: false })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort dates in descending order', () => {
  const data = [
    new Date('2020-09-11T00:00:00Z'),
    new Date('2022-03-04T18:43:11Z'),
    new Date('2021-11-04T17:39:38Z'),
  ]
  const expected = [
    new Date('2022-03-04T18:43:11Z'),
    new Date('2021-11-04T17:39:38Z'),
    new Date('2020-09-11T00:00:00Z'),
  ]

  const ret = sort({ asc: false })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort null and undefined last in descending order', () => {
  const data = [null, 5, 'zero', undefined, 3, 'Alice', 15, 'Bob']
  const expected = ['zero', 'Bob', 'Alice', 15, 5, 3, null, undefined]

  const ret = sort({ asc: false })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should not sort objects', () => {
  const data = [{ id: '3' }, { id: '1' }, { id: '2' }]
  const expected = [{ id: '3' }, { id: '1' }, { id: '2' }]

  const ret = sort({ asc: true })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort with a path', () => {
  const data = [{ value: 5 }, { value: 3 }, { value: 15 }]
  const expected = [{ value: 3 }, { value: 5 }, { value: 15 }]

  const ret = sort({ asc: true, path: 'value' })(options)(data, state)

  assert.deepEqual(ret, expected)
})

test('should sort in reverse', () => {
  const data = [5, 3, 15]
  const expected = [3, 5, 15]

  const ret = sort({ asc: true })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should sort with path in reverse', () => {
  const data = [{ value: 5 }, { value: 3 }, { value: 15 }]
  const expected = [{ value: 3 }, { value: 5 }, { value: 15 }]

  const ret = sort({ asc: true, path: 'value' })(options)(data, stateRev)

  assert.deepEqual(ret, expected)
})

test('should throw when path is a pipeline', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path = ['value', { $transform: 'string' }] as any
  const data = [{ value: 5 }, { value: 3 }, { value: 15 }]
  const expectedError = new TypeError(
    "The 'sort' transformer does not allow `path` to be a pipeline",
  )

  assert.throws(
    () => sort({ asc: true, path })(options)(data, state),
    expectedError,
  )
})
