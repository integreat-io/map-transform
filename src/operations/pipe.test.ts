import test from 'ava'
import { State } from '../types'
import { get, set } from './getSet'

import pipe from './pipe'

// Setup

const data = { name: 'John F.' }

const state = {
  root: { data },
  context: { data },
  value: { data },
}

const options = {}

const getNameFromContext = () => (state: State) => ({
  ...state,
  value: (state.context as Record<string, unknown>).name,
})

// Tests

test('should run map pipe', (t) => {
  const def = [get('data'), get('name')]
  const expected = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: 'John F.',
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const def = ['data', get('name')]
  const expectedValue = 'John F.'

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should treat object as map object', (t) => {
  const def = ['data', { fullName: 'name' }]
  const expectedValue = { fullName: 'John F.' }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should update context when entering a pipeline', (t) => {
  const def = [getNameFromContext]
  const state = {
    root: { data },
    context: { data },
    value: data,
  }
  const expectedValue = 'John F.'

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map pipe on reverse mapping', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    root: 'John F.',
    context: 'John F.',
    value: 'John F.',
    rev: true,
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    value: { data: { name: 'John F.' } },
    rev: true,
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat target right going forward', (t) => {
  const def = [set('name'), set('data')]
  const state = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { age: 32 } },
    value: 'John F.',
    rev: false,
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { age: 32 } },
    value: { data: { name: 'John F.', age: 32 } },
    rev: false,
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat target right in reverse', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { age: 32 } },
    value: 'John F.',
    rev: true,
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { age: 32 } },
    value: { data: { name: 'John F.', age: 32 } },
    rev: true,
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should update context when entering a pipeline in reverse', (t) => {
  const def = [getNameFromContext]
  const state = {
    root: { data },
    context: { data },
    value: data,
    rev: true,
  }
  const expectedValue = 'John F.'

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test.todo('should handle empty pipeline')
