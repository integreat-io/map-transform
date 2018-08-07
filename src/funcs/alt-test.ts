import test from 'ava'
import { State } from '../types'

import alt from './alt'

// Helpers

const getUser = (state: State) => ({ ...state, value: (state.value as any).user })

// Tests

test('should set alt value when value is undefined', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'johnf'
  }

  const ret = alt(getUser)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when value is set', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'maryk'
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'maryk'
  }

  const ret = alt(getUser)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'johnf'
  }

  const ret = alt('user')(state)

  t.deepEqual(ret, expected)
})

test('should treat array as map pipe', (t) => {
  const state = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: undefined
  }
  const expected = {
    root: { user: 'johnf' },
    context: { user: 'johnf' },
    value: 'johnf'
  }

  const ret = alt(['user'])(state)

  t.deepEqual(ret, expected)
})
