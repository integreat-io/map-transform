import test from 'node:test'
import assert from 'node:assert/strict'
import type { State } from '../types.js'

import runPipeline, { runPipelineAsync } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

const isNumber = (value: unknown, _state: State) => typeof value === 'number'
const isNumberAsync = async (value: unknown, _state: State) =>
  typeof value === 'number'

// Tests -- sync

test('should filter away items in array', () => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumber }],
    },
  ]
  const expected = [2, 5]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should filter away items in array with a full pipeline', () => {
  const value = [
    { value: 'One' },
    { value: 2 },
    undefined,
    { value: '3' },
    { value: 'four' },
    { value: 5 },
    {},
  ]
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: ['value', { type: 'transform' as const, fn: isNumber }],
    },
  ]
  const expected = [{ value: 2 }, { value: 5 }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return value when filter returns true for single value', () => {
  const value = 2
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumber }],
    },
  ]
  const expected = 2

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should return undefined when filter returns false for single value', () => {
  const value = 'One'
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumber }],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  assert.equal(ret, expected)
})

test('should filter away items in array in reverse', () => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumber }],
    },
  ]
  const expected = [2, 5]

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should filter away items in array async', async () => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumberAsync }],
    },
  ]
  const expected = [2, 5]

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when filter returns false for single value async', async () => {
  const value = 'One'
  const pipeline = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isNumberAsync }],
    },
  ]
  const expected = undefined

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.equal(ret, expected)
})
