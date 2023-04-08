import test from 'ava'
import type { State } from '../types.js'
import { identity } from '../utils/functional.js'

import filter from './filter.js'

// Helpers

const beginsWithA = () => (str: unknown) =>
  typeof str === 'string' ? str.startsWith('A') : false

const isParam = () => (str: unknown, state: State) =>
  str === (state.target as Record<string, unknown>).allowedUser

const options = {}

// Tests

test('should set value to undefined when filter returns false', (t) => {
  const state = {
    context: [{ title: 'Other entry' }],
    value: 'Other entry',
  }
  const expected = {
    context: [{ title: 'Other entry' }],
    value: undefined,
  }

  const ret = filter(beginsWithA)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter returns true', (t) => {
  const state = {
    context: [{ title: 'An entry' }],
    value: 'An entry',
  }

  const ret = filter(beginsWithA)(options)(identity)(state)

  t.deepEqual(ret, state)
})

test('should remove values in array when filter returns false', (t) => {
  const state = {
    context: [{ users: ['John F', 'Andy'] }],
    value: ['John F', 'Andy'],
  }
  const expected = {
    context: [{ users: ['John F', 'Andy'] }],
    value: ['Andy'],
  }

  const ret = filter(beginsWithA)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should provide state to filter function', (t) => {
  const state = {
    context: [],
    target: { users: ['John F', 'Andy'], allowedUser: 'John F' },
    value: ['John F', 'Andy'],
  }
  const expected = {
    ...state,
    value: ['John F'],
  }

  const ret = filter(isParam)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter is not a function', (t) => {
  const state = {
    context: [{ title: 'An entry' }],
    value: 'An entry',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = filter('notallowed' as any)(options)(identity)(state)

  t.deepEqual(ret, state)
})
