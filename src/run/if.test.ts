import test from 'ava'
import { isObject } from '../utils/is.js'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const getIsActiveAsync = async (value: unknown) =>
  isObject(value) ? value.isActive : undefined

const state = { rev: false }
// const stateRev = { rev: true }

// Tests -- sync

test('should run then pipeline when condition is true', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should run else pipeline when condition is false', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should do nothing when condition is true and empty then pipeline', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should do nothing when condition is false and empty else pipeline', (t) => {
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

  t.deepEqual(ret, expected)
})

test('should run else pipeline when no condition', (t) => {
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

  t.deepEqual(ret, expected)
})

// Tests -- async

test('should run then pipeline when async condition is true', async (t) => {
  const value = { isActive: true }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: [{ type: 'transform', fn: getIsActiveAsync }],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'active' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run else pipeline when async condition is false', async (t) => {
  const value = { isActive: false }
  const pipeline: PreppedPipeline = [
    {
      type: 'if',
      condition: [{ type: 'transform', fn: getIsActiveAsync }],
      then: [{ type: 'value', value: 'active' }, '>state'],
      else: [{ type: 'value', value: 'inactive' }, '>state'],
    },
  ]
  const expected = { state: 'inactive' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test.todo('should run in reverse ...')
