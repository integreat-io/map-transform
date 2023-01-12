import test from 'ava'
import { defsToDataMapper } from '../utils/definitionHelpers'

import { join, split } from './joinSplit'

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

const options = { defsToDataMapper }

// Test -- join forward

test('should join strings given by paths going forward', (t) => {
  const path = ['firstName', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path }, options)(data, state)

  t.is(ret, expected)
})

test('should use given separator', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'Fjon, John'

  const ret = join({ path, sep }, options)(data, state)

  t.is(ret, expected)
})

test('should return the value of only one path', (t) => {
  const path = 'firstName'
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John'

  const ret = join({ path }, options)(data, state)

  t.is(ret, expected)
})

test('should skip unknown paths', (t) => {
  const path = ['firstName', 'unknown', 'lastName']
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'John Fjon'

  const ret = join({ path }, options)(data, state)

  t.is(ret, expected)
})

test('should join array of strings when no paths', (t) => {
  const data = ['John', 'Fjon']
  const expected = 'John Fjon'

  const ret = join({}, options)(data, state)

  t.is(ret, expected)
})

test('should join array of strings with separator', (t) => {
  const sep = ', '
  const data = ['Fjon', 'John']
  const expected = 'Fjon, John'

  const ret = join({ sep }, options)(data, state)

  t.is(ret, expected)
})

test('should return undefined when no paths and not an array', (t) => {
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = undefined

  const ret = join({}, options)(data, state)

  t.is(ret, expected)
})

// Tests -- join rev

test('should split strings in reverse', (t) => {
  const path = ['firstName', 'lastName']
  const data = 'John Fjon'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = join({ path }, options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should split strings in reverse with given seperator', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = 'Fjon, John'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = join({ path, sep }, options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should split strings to only one path', (t) => {
  const path = 'firstName'
  const data = 'John Fjon'
  const expected = { firstName: 'John' }

  const ret = join({ path }, options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should split to array of strings when no paths', (t) => {
  const data = 'Fjon, John'
  const sep = ', '
  const expected = ['Fjon', 'John']

  const ret = join({ sep }, options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return undefined when no paths and not string in rev', (t) => {
  const data = {}
  const expected = undefined

  const ret = join({}, options)(data, stateRev)

  t.is(ret, expected)
})

// Tests -- split

test('should split strings going forward', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = 'Fjon, John'
  const expected = { firstName: 'John', lastName: 'Fjon' }

  const ret = split({ path, sep }, options)(data, state)

  t.deepEqual(ret, expected)
})

test('should split strings without paths going forward', (t) => {
  const sep = ', '
  const data = 'Fjon, John'
  const expected = ['Fjon', 'John']

  const ret = split({ sep }, options)(data, state)

  t.deepEqual(ret, expected)
})

test('should join string in reverse', (t) => {
  const path = ['lastName', 'firstName']
  const sep = ', '
  const data = { firstName: 'John', lastName: 'Fjon', age: 36 }
  const expected = 'Fjon, John'

  const ret = split({ path, sep }, options)(data, stateRev)

  t.is(ret, expected)
})

test('should join string wihtout paths in reverse', (t) => {
  const sep = ', '
  const data = ['Fjon', 'John']
  const expected = 'Fjon, John'

  const ret = split({ sep }, options)(data, stateRev)

  t.is(ret, expected)
})
