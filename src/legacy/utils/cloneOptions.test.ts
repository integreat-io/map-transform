import test from 'node:test'
import assert from 'node:assert/strict'

import { cloneOptions } from './cloneOptions.js'

import type { Operation, Options } from '../types.js'

// Setup

const pipelines = { entry: ['data', 'item'] }
const transformers = { upper: () => () => async (value: unknown) => value }
const dictionaries = { yesNo: [['yes', true] as const, ['no', false] as const] }

// Tests

test('should shallow clone options', () => {
  const options: Options = { pipelines, transformers, dictionaries }

  const ret = cloneOptions(options)

  assert.notEqual(ret, options)
  assert.equal(ret.pipelines, pipelines) // Passed on by reference
  assert.equal(ret.transformers, transformers)
  assert.equal(ret.dictionaries, dictionaries)
})

test('should apply changes to the clone only', () => {
  const options: Options = { pipelines, nonvalues: [undefined] }

  const ret = cloneOptions(options, { nonvalues: [undefined, null] })

  assert.deepEqual(ret.nonvalues, [undefined, null])
  assert.deepEqual(options.nonvalues, [undefined]) // The original is untouched
})

test('should share neededPipelineIds and preparedPipelines with the original', () => {
  const neededPipelineIds = new Set<string | symbol>(['entry'])
  const preparedPipelines = new Map<string | symbol, Operation>()
  const options: Options = { pipelines, neededPipelineIds, preparedPipelines }

  const ret = cloneOptions(options)

  assert.equal(ret.neededPipelineIds, neededPipelineIds)
  assert.equal(ret.preparedPipelines, preparedPipelines)
})

test('should create neededPipelineIds and preparedPipelines when they are missing', () => {
  const options: Options = { pipelines }
  const operation: Operation = () => (next) => next

  const ret = cloneOptions(options)

  assert.ok(ret.neededPipelineIds instanceof Set)
  assert.ok(ret.preparedPipelines instanceof Map)
  // They are set on the original too, so that they are actually shared
  assert.equal(ret.neededPipelineIds, options.neededPipelineIds)
  assert.equal(ret.preparedPipelines, options.preparedPipelines)

  // What we add to the clone is known to the original
  ret.neededPipelineIds?.add('entry')
  ret.preparedPipelines?.set('entry', operation)
  assert.ok(options.neededPipelineIds?.has('entry'))
  assert.equal(options.preparedPipelines?.get('entry'), operation)
})

test('should not let changes override the shared props', () => {
  const neededPipelineIds = new Set<string | symbol>(['entry'])
  const preparedPipelines = new Map<string | symbol, Operation>()
  const options: Options = { pipelines, neededPipelineIds, preparedPipelines }

  const ret = cloneOptions(options, {
    neededPipelineIds: new Set(),
    preparedPipelines: new Map(),
  })

  assert.equal(ret.neededPipelineIds, neededPipelineIds)
  assert.equal(ret.preparedPipelines, preparedPipelines)
})
