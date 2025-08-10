import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../utils/is.js'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const getIsActiveAsync = async (value: unknown) =>
  isObject(value) ? value.isActive : undefined

const notFn = async (value: unknown) => !value

const uppercaseAsync = async (value: unknown) =>
  typeof value === 'string' ? value.toUpperCase() : value

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

test('should run then pipeline when condition is true', () => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'active' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run else pipeline when condition is false', () => {
  const value = { isActive: false }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'inactive' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should do nothing when condition is true and empty then pipeline', () => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { isActive: true }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should do nothing when condition is false and empty else pipeline', () => {
  const value = { isActive: false }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [],
    },
  ]
  const expected = { isActive: false }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run else pipeline when no condition', () => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'inactive' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should always run condition pipeline as forward', () => {
  const value = { isActive: false, title: 'The title', name: 'The name' }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: ['>title'],
      else: ['>name'],
    },
  ]
  const expected = 'The name'

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should run then-pipeline when async condition is true', async () => {
  const value = { isActive: false }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: [
        { type: 'transform', fn: getIsActiveAsync },
        { type: 'transform', fn: notFn },
      ],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'active' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run else-pipeline when async condition is false', async () => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: [
        { type: 'transform', fn: getIsActiveAsync },
        { type: 'transform', fn: notFn },
      ],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'inactive' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run async then-pipeline', async () => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [
        { type: 'value', value: 'active' },
        { type: 'transform', fn: uppercaseAsync },
        '>state',
      ],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'ACTIVE' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run async else-pipeline', async () => {
  const value = { isActive: false }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [
        { type: 'value', value: 'inactive' },
        { type: 'transform', fn: uppercaseAsync },
        '>state',
      ],
    },
  ]
  const expected = { state: 'INACTIVE' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should always run async condition pipeline as forward', async () => {
  const value = { isActive: false, title: 'The title', name: 'The name' }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: ['isActive'],
      then: ['>title'],
      else: ['>name'],
    },
  ]
  const expected = 'The name'

  const ret = await runPipelineAsync(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})
