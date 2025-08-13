import test from 'node:test'
import assert from 'node:assert/strict'

import runPipeline, { PreppedPipeline, runPipelineAsync } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

test('should iterate over an array', () => {
  const value = [
    { key: 'ent1', name: 'Entry 1' },
    { key: 'ent2', name: 'Entry 2' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'iterate',
      pipeline: ['name', '>title'],
    },
  ]
  const expected = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should apply pipeline to a single item', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'iterate',
      pipeline: ['name', '>title'],
    },
  ]
  const expected = { title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should iterate in reverse', () => {
  const value = [{ title: 'Entry 1' }, { title: 'Entry 2' }]
  const pipeline: PreppedPipeline = [
    {
      type: 'iterate',
      pipeline: ['name', '>title'],
    },
  ]
  const expected = [{ name: 'Entry 1' }, { name: 'Entry 2' }]

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should iterate over an array with an async pipeline', async () => {
  const fn = async () => 'From async'
  const value = [
    { key: 'ent1', name: 'Entry 1' },
    { key: 'ent2', name: 'Entry 2' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'iterate',
      pipeline: [{ type: 'transform', fn }, '>title'],
    },
  ]
  const expected = [{ title: 'From async' }, { title: 'From async' }]

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should apply async pipeline to a single item', async () => {
  const fn = async () => 'From async'
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline: PreppedPipeline = [
    {
      type: 'iterate',
      pipeline: [{ type: 'transform', fn }, '>title'],
    },
  ]
  const expected = { title: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})
