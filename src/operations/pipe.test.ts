import test from 'ava'
import { get } from './getSet'

import pipe from './pipe'

// Setup

const options = {}

// Tests

test('should run map pipe', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: { data: { name: 'John F.' } }
  }
  const expected = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: 'John F.'
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const def = ['data', get('name')]
  const state = {
    root: {},
    context: {},
    value: { data: { name: 'John F.' } }
  }
  const expectedValue = 'John F.'

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should treat object as map object', (t) => {
  const def = ['data', { fullName: 'name' }]
  const state = {
    root: {},
    context: {},
    value: { data: { name: 'John F.' } }
  }
  const expectedValue = { fullName: 'John F.' }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map pipe on reverse mapping', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    root: 'John F.',
    context: 'John F.',
    value: 'John F.',
    rev: true
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    value: { data: { name: 'John F.' } },
    rev: true
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})
