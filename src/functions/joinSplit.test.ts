import test from 'ava'

import { join, split } from './joinSplit'

// Setup

const state = {
  rev: false,
  onlyMapped: false,
  root: {},
  context: {},
  value: {},
}
const stateRev = {
  rev: true,
  onlyMapped: false,
  root: {},
  context: {},
  value: {},
}

// Test -- join forward

test('should join strings given by paths going forward', (t) => {
  const path = ['firstName', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path })(data, state)

  t.is(ret, expected)
})

test('should use given separator', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'Fjon, John'

  const ret = join({ path, sep })(data, state)

  t.is(ret, expected)
})

test('should return the value of only one path', (t) => {
  const path = 'firstName'
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John'

  const ret = join({ path })(data, state)

  t.is(ret, expected)
})

test('should return undefined when no paths', (t) => {
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = undefined

  const ret = join({})(data, state)

  t.is(ret, expected)
})

test('should skip unknown paths', (t) => {
  const path = ['firstName', 'unknown', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path })(data, state)

  t.is(ret, expected)
})

// Tests -- join rev

test('should split strings in reverse', (t) => {
  const path = ['firstName', 'lastName']
  const data = 'John Fjon'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = join({ path })(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should split strings in reverse with given seperator', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = 'Fjon, John'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = join({ path, sep })(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should split strings to only one path', (t) => {
  const path = 'firstName'
  const data = 'John Fjon'
  const expected = { firstName: 'John' }

  const ret = join({ path })(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return undefined when no paths in rev', (t) => {
  const data = 'John Fjon'
  const expected = undefined

  const ret = join({})(data, stateRev)

  t.is(ret, expected)
})

// Tests -- split

test('should split strings going forward', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = 'Fjon, John'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = split({ path, sep })(data, state)

  t.deepEqual(ret, expected)
})

test('should join string in reverse', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'Fjon, John'

  const ret = split({ path, sep })(data, stateRev)

  t.is(ret, expected)
})
