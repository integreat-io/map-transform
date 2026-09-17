import test from 'node:test'
import assert from 'node:assert/strict'
import type { Transformer } from './typesNext.js'

import { createInternalOptions } from './internalOptions.js'

// Setup

const upper: Transformer = () => () => (value) => String(value).toUpperCase()
const lower: Transformer = () => () => (value) => String(value).toLowerCase()

// Tests -- createInternalOptions

test('should add built-in transformers and a prepared pipelines Map', () => {
  const options = { pipelines: { entry: 'data' }, transformers: { lower } }
  const builtIns = { upper }

  const ret = createInternalOptions(options, 'sync', builtIns)

  assert.notEqual(ret, options)
  assert.deepEqual(ret.pipelines, { entry: 'data' })
  assert.equal(ret.transformers?.upper, upper)
  assert.equal(ret.transformers?.lower, lower)
  assert.ok(ret.preparedPipelines instanceof Map)
})

test('should let custom transformers override built-in ones', () => {
  const options = { transformers: { upper: lower } }
  const builtIns = { upper }

  const ret = createInternalOptions(options, 'sync', builtIns)

  assert.equal(ret.transformers?.upper, lower)
})

test('should share the Map between calls with the same options object', () => {
  const options = { pipelines: { entry: 'data' } }

  const retA = createInternalOptions(options, 'sync', {})
  const retB = createInternalOptions(options, 'sync', {})

  assert.equal(retA.preparedPipelines, retB.preparedPipelines)
})

test('should not share the Map between different options objects', () => {
  const optionsA = { pipelines: { entry: 'data' } }
  const optionsB = { pipelines: { entry: 'data' } }

  const retA = createInternalOptions(optionsA, 'sync', {})
  const retB = createInternalOptions(optionsB, 'sync', {})

  assert.notEqual(retA.preparedPipelines, retB.preparedPipelines)
})

test('should use separate Maps for sync and async', () => {
  const options = { pipelines: { entry: 'data' } }

  const retSync = createInternalOptions(options, 'sync', {})
  const retAsync = createInternalOptions(options, 'async', {})

  assert.notEqual(retSync.preparedPipelines, retAsync.preparedPipelines)
})

test('should share the Map with a call on the internal options', () => {
  const options = { pipelines: { entry: 'data' } }
  const internalOptions = createInternalOptions(options, 'sync', {})

  const ret = createInternalOptions(internalOptions, 'sync', {})

  assert.equal(ret.preparedPipelines, internalOptions.preparedPipelines)
})

test('should give the other mode its own Map on a call on the internal options', () => {
  const options = { pipelines: { entry: 'data' } }
  const internalOptions = createInternalOptions(options, 'async', {})
  const expected = createInternalOptions(options, 'sync', {}).preparedPipelines

  const ret = createInternalOptions(internalOptions, 'sync', {})

  assert.equal(ret.preparedPipelines, expected)
  assert.notEqual(ret.preparedPipelines, internalOptions.preparedPipelines)
})
