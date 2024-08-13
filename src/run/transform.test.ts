import test from 'ava'
import type { State } from '../types.js'

import runPipeline from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

const uppercase = (val: unknown, state: State) =>
  typeof val === 'string'
    ? state.rev
      ? val.toLowerCase()
      : val.toUpperCase()
    : val

const size = (val: unknown) => (Array.isArray(val) ? val.length : 0)

// Tests

test('should run transformer function', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase }]
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should pass on state to transformer function', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase }]
  const expected = 'hello' // Does lowercase in rev

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should run transformer function on array', (t) => {
  const value = ['Hello', 'Hello again']
  const pipeline = [{ type: 'transform' as const, fn: size }]
  const expected = 2

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should iterate transformer function on array when it is true', (t) => {
  const value = ['Hello', 'Hello again']
  const pipeline = [{ type: 'transform' as const, fn: uppercase, it: true }]
  const expected = ['HELLO', 'HELLO AGAIN']

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run transformer function going forward', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not run transformer function going in reverse', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should run transformer function going in reverse', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: -1 }]
  const expected = 'hello'

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should not run transformer function going forward', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: -1 }]
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})
