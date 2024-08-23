import test from 'ava'
import type { State } from '../types.js'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const uppercase = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

test('should run a simple pipeline', (t) => {
  const pipeline = ['items']
  const value = { items: [{ id: 'ent1' }, { id: 'ent2' }] }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should iterate with an operation and make index available on state', (t) => {
  const fn = (_value: unknown, state: State) => state.index ?? 0
  const value = [
    { key: 'ent1', name: 'Entry 1' },
    { key: 'ent2', name: 'Entry 2' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [{ type: 'transform', fn }, '>order'],
      ],
    },
  ]
  const expected = [
    { id: 'ent1', title: 'Entry 1', order: 0 },
    { id: 'ent2', title: 'Entry 2', order: 1 },
  ]

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not touch value when empty pipeline', (t) => {
  const pipeline: PreppedPipeline = []
  const value = { id: 'ent1' }

  const ret = runPipeline(value, pipeline, state)

  t.is(ret, value)
})

test('should run operation going forward', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, state)

  t.deepEqual(ret, expected)
})

test('should not run operation function going in reverse', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const expected = 'Hello'

  const ret = runPipeline(value, pipeline, stateRev)

  t.deepEqual(ret, expected)
})

test('should ignore flip when checking direction', (t) => {
  const value = 'Hello'
  const pipeline = [{ type: 'transform' as const, fn: uppercase, dir: 1 }]
  const stateFlipped = { ...state, flip: true }
  const expected = 'HELLO'

  const ret = runPipeline(value, pipeline, stateFlipped)

  t.deepEqual(ret, expected)
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

test('should iterate with an operation and make index available on state for async', async (t) => {
  const fn = async (_value: unknown, state: State) => state.index ?? 0
  const value = [
    { key: 'ent1', name: 'Entry 1' },
    { key: 'ent2', name: 'Entry 2' },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [{ type: 'transform', fn }, '>order'],
      ],
    },
  ]
  const expected = [
    { id: 'ent1', title: 'Entry 1', order: 0 },
    { id: 'ent2', title: 'Entry 2', order: 1 },
  ]

  const ret = await runPipelineAsync(value, pipeline, state)

  t.deepEqual(ret, expected)
})
