import test from 'ava'

import runTransformStep from './transform.js'
import type { State } from '../types.js'

// Setup

const state = {
  context: [{ title: 'Hello' }],
  value: 'Hello',
}
const stateRev = {
  ...state,
  rev: true,
}

const uppercase = (val: unknown, state: State) =>
  typeof val === 'string'
    ? state.rev
      ? val.toLowerCase()
      : val.toUpperCase()
    : val

// Tests

test('should run transformer function', (t) => {
  const value = 'Hello'
  const step = { type: 'transform' as const, fn: uppercase }
  const expected = 'HELLO'

  const ret = runTransformStep(value, step, state)

  t.deepEqual(ret, expected)
})

test('should pass on state to transformer function', (t) => {
  const value = 'Hello'
  const step = { type: 'transform' as const, fn: uppercase }
  const expected = 'hello' // Does lowercase in rev

  const ret = runTransformStep(value, step, stateRev)

  t.deepEqual(ret, expected)
})
