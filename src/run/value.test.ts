import test from 'node:test'
import assert from 'node:assert/strict'

import runPipeline from './index.js'

// Setup

const state = { rev: false }

// Tests

test('should return value', () => {
  const pipeline = [{ type: 'value' as const, value: 'Hello' }]
  const value = { id: 'ent1' }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return undefined', () => {
  const pipeline = [{ type: 'value' as const, value: undefined }]
  const value = { id: 'ent1' }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return object', () => {
  const pipeline = [{ type: 'value' as const, value: { id: 'ent0' } }]
  const value = { id: 'ent1' }
  const expected = { id: 'ent0' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return function as value', () => {
  // Note: This is not a feature that is important to have like this. It's just
  // a by-product of dropping support for applying values through functions. So
  // the new behavior is like this – returning the function, but it's really not
  // a relevant use case for map-transform, and changing this behavior in the
  // future, if needed, should be okay.
  const fn = () => 'From fn'
  const pipeline = [{ type: 'value' as const, value: fn }]
  const value = { id: 'ent1' }
  const expected = fn

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should not return a value when noDefaults is true', () => {
  const pipeline = [{ type: 'value' as const, value: 'Hello' }]
  const value = { id: 'ent1' }
  const state = { noDefaults: true }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return fixed value', () => {
  const pipeline = [{ type: 'value' as const, value: 'Hello', fixed: true }]
  const value = { id: 'ent1' }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return fixed value even when noDefaults is true', () => {
  const pipeline = [{ type: 'value' as const, value: 'Hello', fixed: true }]
  const value = { id: 'ent1' }
  const state = { noDefaults: true }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})
