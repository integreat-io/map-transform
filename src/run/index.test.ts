import test from 'ava'

import runPipeline, { PreppedPipeline } from './index.js'

// Setup

const state = { rev: false }

// Tests

test('should run a simple pipeline', (t) => {
  const pipeline = ['items']
  const value = { items: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not touch value when empty pipeline', (t) => {
  const pipeline: PreppedPipeline = []
  const value = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, value)
})

test('should throw when an operation step has an unknown type', (t) => {
  const pipeline = ['items', { type: 'unknown' }] as PreppedPipeline
  const value = { items: [] }

  const error = t.throws(() => runPipeline(value, pipeline, state))

  t.true(error instanceof Error)
  t.is(error.message, "Unknown operation type 'unknown'")
})
