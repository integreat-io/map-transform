import test from 'ava'

import runPipeline from './index.js'

// Setup

const state = { rev: false }

// Tests

test('should return value', (t) => {
  const pipeline = [{ type: 'value' as const, value: 'Hello' }]
  const value = { id: 'ent1' }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return undefined', (t) => {
  const pipeline = [{ type: 'value' as const, value: undefined }]
  const value = { id: 'ent1' }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return object', (t) => {
  const pipeline = [{ type: 'value' as const, value: { id: 'ent0' } }]
  const value = { id: 'ent1' }
  const expected = { id: 'ent0' }

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should return value from function', (t) => {
  const pipeline = [{ type: 'value' as const, value: () => 'From fn' }]
  const value = { id: 'ent1' }
  const expected = 'From fn'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should not return a value when noDefaults is true', (t) => {
  const pipeline = [{ type: 'value' as const, value: 'Hello' }]
  const value = { id: 'ent1' }
  const state = { noDefaults: true }
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return fixed value', (t) => {
  const pipeline = [{ type: 'value' as const, value: 'Hello', fixed: true }]
  const value = { id: 'ent1' }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return fixed value even when noDefaults is true', (t) => {
  const pipeline = [{ type: 'value' as const, value: 'Hello', fixed: true }]
  const value = { id: 'ent1' }
  const state = { noDefaults: true }
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})
