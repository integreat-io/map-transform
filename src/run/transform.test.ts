import test from 'node:test'
import assert from 'node:assert/strict'
import type State from '../state.js'

import runPipeline, { runPipelineAsync } from './index.js'

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

test('should run transformer function', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase }]
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should pass on state to transformer function', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase }]
  const expected = 'hello' // Does lowercase in rev

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should run transformer function on array', () => {
  const value = ['Hello', 'Hello again']
  const pipeline = [{ type: 'transform' as const, fn: size }]
  const expected = 2

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should iterate transformer function on array when it is true', () => {
  const value = ['Hello', 'Hello again']
  const pipeline = [{ type: 'transform' as const, fn: uppercase, it: true }]
  const expected = ['HELLO', 'HELLO AGAIN']

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run transformer function going forward', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not run transformer function going in reverse', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should run transformer function going in reverse', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: -1 }]
  const expected = 'hello'

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should not run transformer function going forward', () => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: -1 }]
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should throw when transformer returns a promise', () => {
  const value = 'Hello'
  const asyncUppercase = async (val: unknown) =>
    typeof val === 'string' ? val.toUpperCase() : val
  const pipeline = [{ type: 'transform' as const, fn: asyncUppercase }]
  const expectedError = new Error(
    'A transformer returned a promise in a synchronous pipeline. Use mapTransformAsync() to run async transformers',
  )

  assert.throws(() => runPipeline(value, pipeline, state), expectedError)
})

test('should throw when transformer returns a thenable', () => {
  const value = 'Hello'
  const thenableUppercase = () => ({ then: () => undefined })
  const pipeline = [{ type: 'transform' as const, fn: thenableUppercase }]
  const expectedError = new Error(
    'A transformer returned a promise in a synchronous pipeline. Use mapTransformAsync() to run async transformers',
  )

  assert.throws(() => runPipeline(value, pipeline, state), expectedError)
})

test('should not throw when transformer returns a promise in an async pipeline', async () => {
  const value = 'Hello'
  const asyncUppercase = async (val: unknown) =>
    typeof val === 'string' ? val.toUpperCase() : val
  const pipeline = [{ type: 'transform' as const, fn: asyncUppercase }]
  const expected = 'HELLO'

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.equal(ret, expected)
})
