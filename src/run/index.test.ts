import test from 'ava'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const state = { rev: false }

// Tests -- sync

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

// Tests -- async

test('should run a simple pipeline asynchronously', async (t) => {
  const pipeline = ['items']
  const value = { items: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run a pipeline with an async transformer', async (t) => {
  const fn = async () => 'From async'
  const pipeline = [{ type: 'transform' as const, fn }, '>value']
  const value = { id: 'ent1' }
  const expected = { value: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run a pipeline with an async transformer in a mutation object', async (t) => {
  const fn = async () => 'From async'
  const pipeline = [
    {
      type: 'mutation' as const,
      pipelines: [
        ['key', '>id'],
        [{ type: 'transform' as const, fn }, '>value'],
      ],
    },
  ]
  const value = { key: 'ent1' }
  const expected = { id: 'ent1', value: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run a pipeline applying an async pipline', async (t) => {
  const fn = async () => 'From async'
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const pipelines = new Map()
  pipelines.set('entry', [
    {
      type: 'mutation' as const,
      pipelines: [
        ['key', '>id'],
        [{ type: 'transform' as const, fn }, '>value'],
      ],
    },
  ])
  const state = { pipelines }
  const value = { key: 'ent1' }
  const expected = { id: 'ent1', value: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should run a pipeline with async alt pipelines', async (t) => {
  const fn = async () => 'From async'
  const pipeline = [
    {
      type: 'alt' as const,
      pipelines: [['name'], [{ type: 'transform' as const, fn }, '>value']],
    },
  ]
  const value = { key: 'ent1' }
  const expected = { value: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})
