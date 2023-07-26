import test from 'ava'
import type { State } from '../types.js'
import { noopNext } from '../utils/stateHelpers.js'

import filter from './filter.js'

// Helpers

const beginsWithA = () => async (str: unknown) =>
  typeof str === 'string' ? str.startsWith('A') : false

const isParam = () => async (str: unknown, state: State) =>
  str === (state.target as Record<string, unknown>).allowedUser

const options = {}

// Tests

test('should set value to undefined when filter returns false', async (t) => {
  const state = {
    context: [{ title: 'Other entry' }],
    value: 'Other entry',
  }
  const expected = {
    context: [{ title: 'Other entry' }],
    value: undefined,
  }

  const ret = await filter(beginsWithA)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter returns true', async (t) => {
  const state = {
    context: [{ title: 'An entry' }],
    value: 'An entry',
  }

  const ret = await filter(beginsWithA)(options)(noopNext)(state)

  t.deepEqual(ret, state)
})

test('should remove values in array when filter returns false', async (t) => {
  const state = {
    context: [{ users: ['John F', 'Andy'] }],
    value: ['John F', 'Andy'],
  }
  const expected = {
    context: [{ users: ['John F', 'Andy'] }],
    value: ['Andy'],
  }

  const ret = await filter(beginsWithA)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should provide state to filter function', async (t) => {
  const state = {
    context: [],
    target: { users: ['John F', 'Andy'], allowedUser: 'John F' },
    value: ['John F', 'Andy'],
  }
  const expected = {
    ...state,
    value: ['John F'],
  }

  const ret = await filter(isParam)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter is not a function', async (t) => {
  const state = {
    context: [{ title: 'An entry' }],
    value: 'An entry',
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = await filter('notallowed' as any)(options)(noopNext)(state)

  t.deepEqual(ret, state)
})
