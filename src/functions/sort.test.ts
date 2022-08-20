import test from 'ava'

import sort from './sort'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  onlyMapped: false,
  context: [],
  value: {},
}

// Tests

test('should sort numbers in ascending order', (t) => {
  const data = [5, 3, 15]
  const expected = [3, 5, 15]

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort strings in ascending order', (t) => {
  const data = ['John', 'Alice', 'Bob']
  const expected = ['Alice', 'Bob', 'John']

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort booleans in ascending order', (t) => {
  const data = [true, false, true]
  const expected = [false, true, true]

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort dates in ascending order', (t) => {
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

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort null and undefined last', (t) => {
  const data = [null, 5, 'zero', undefined, 3, 'Alice', 15, 'Bob']
  const expected = [3, 5, 15, 'Alice', 'Bob', 'zero', null, undefined]

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort numbers in descending order', (t) => {
  const data = [5, 3, 15]
  const expected = [15, 5, 3]

  const ret = sort({ asc: false })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort strings in descending order', (t) => {
  const data = ['John', 'Alice', 'Bob']
  const expected = ['John', 'Bob', 'Alice']

  const ret = sort({ asc: false })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort dates in descending order', (t) => {
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

  const ret = sort({ asc: false })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort null and undefined last in descending order', (t) => {
  const data = [null, 5, 'zero', undefined, 3, 'Alice', 15, 'Bob']
  const expected = ['zero', 'Bob', 'Alice', 15, 5, 3, null, undefined]

  const ret = sort({ asc: false })(data, state)

  t.deepEqual(ret, expected)
})

test('should not sort objects', (t) => {
  const data = [{ id: '3' }, { id: '1' }, { id: '2' }]
  const expected = [{ id: '3' }, { id: '1' }, { id: '2' }]

  const ret = sort({ asc: true })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort with a path', (t) => {
  const data = [{ value: 5 }, { value: 3 }, { value: 15 }]
  const expected = [{ value: 3 }, { value: 5 }, { value: 15 }]

  const ret = sort({ asc: true, path: 'value' })(data, state)

  t.deepEqual(ret, expected)
})

test('should sort in reverse', (t) => {
  const data = [5, 3, 15]
  const expected = [3, 5, 15]

  const ret = sort({ asc: true })(data, stateRev)

  t.deepEqual(ret, expected)
})
