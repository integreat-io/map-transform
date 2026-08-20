import test from 'node:test'
import assert from 'node:assert/strict'

import { toInternalOptions } from './internalOptions.js'

import type { Operation, Options } from '../types.js'

// Setup

const pipelines = { entry: ['data', 'item'] }

// Tests

test('should set neededPipelineIds and preparedPipelines when they are missing', () => {
  const options: Options = { pipelines }

  const ret = toInternalOptions(options)

  assert.ok(ret.neededPipelineIds instanceof Set)
  assert.ok(ret.preparedPipelines instanceof Map)
})

test('should set the book-keeping props on the given options object', () => {
  const options: Options = { pipelines }
  const operation: Operation = () => (next) => next

  const ret = toInternalOptions(options)

  assert.equal(ret, options) // We're given the same object back
  // What we add through the returned options is known to the original
  ret.neededPipelineIds.add('entry')
  ret.preparedPipelines.set('entry', operation)
  assert.ok(options.neededPipelineIds?.has('entry'))
  assert.equal(options.preparedPipelines?.get('entry'), operation)
})

test('should keep existing neededPipelineIds and preparedPipelines', () => {
  const neededPipelineIds = new Set<string | symbol>(['entry'])
  const preparedPipelines = new Map<string | symbol, Operation>()
  const options: Options = { pipelines, neededPipelineIds, preparedPipelines }

  const ret = toInternalOptions(options)

  assert.equal(ret.neededPipelineIds, neededPipelineIds)
  assert.equal(ret.preparedPipelines, preparedPipelines)
})
