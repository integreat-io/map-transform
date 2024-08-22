import test from 'ava'
import type { State } from '../types.js'

import runPipeline, { runPipelineAsync } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

const isNumber = (value: unknown, _state: State) => typeof value === 'number'
const isNumberAsync = async (value: unknown, _state: State) =>
  typeof value === 'number'

// Tests -- sync

test('should filter away items in array', (t) => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [{ type: 'filter' as const, fn: isNumber }]
  const expected = [2, 5]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should return value when filter returns true for single value', (t) => {
  const value = 2
  const pipeline = [{ type: 'filter' as const, fn: isNumber }]
  const expected = 2

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should return undefined when filter returns false for single value', (t) => {
  const value = 'One'
  const pipeline = [{ type: 'filter' as const, fn: isNumber }]
  const expected = undefined

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, expected)
})

test('should filter away items in array in reverse', (t) => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [{ type: 'filter' as const, fn: isNumber }]
  const expected = [2, 5]

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

// Tests -- async

test('should filter away items in array async', async (t) => {
  const value = ['One', 2, '3', 'four', 5]
  const pipeline = [{ type: 'filter' as const, fn: isNumberAsync }]
  const expected = [2, 5]

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should return undefined when filter returns false for single value async', async (t) => {
  const value = 'One'
  const pipeline = [{ type: 'filter' as const, fn: isNumberAsync }]
  const expected = undefined

  const ret = await runPipelineAsync(value, pipeline, state)

  t.is(ret, expected)
})
