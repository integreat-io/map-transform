import test from 'ava'
import { State, MapPipe } from '../types'
import { get, set } from './getSet'
import transform from './transform'

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

const json = (data: unknown) => JSON.stringify(data)

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

test('should treat target correctly going forward', (t) => {
  const def = [set('name'), set('personal'), transform(json), set('data.user')]
  const state = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: 'John F.',
    rev: false,
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: {
      data: {
        user: '{"personal":{"age":32,"name":"John F."}}',
        archived: false,
      },
    },
    rev: false,
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat target correctly in reverse', (t) => {
  const def = ['data.user', transform(json), get('personal'), 'name']
  const state = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: 'John F.',
    rev: true,
  }
  const expected = {
    root: 'John F.',
    context: 'John F.',
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: {
      data: {
        user: '{"personal":{"age":32,"name":"John F."}}',
        archived: false,
      },
    },
    rev: true,
  }

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

// TODO: This test was added at some point, but I'm sure what the right behavior really is here
test.skip('should not set undefined on path', (t) => {
  const def = [set('items[]')]
  const state = {
    root: { data },
    context: { data },
    value: undefined,
  }
  const expectedValue = undefined

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
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

test('should handle empty pipeline', (t) => {
  const def: MapPipe = []
  const expected = state

  const ret = pipe(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should handle empty pipeline in reverse', (t) => {
  const def: MapPipe = []
  const stateRev = { ...state, rev: true }
  const expected = stateRev

  const ret = pipe(def)(options)(stateRev)

  t.deepEqual(ret, expected)
})
