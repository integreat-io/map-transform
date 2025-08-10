import test from 'node:test'
import assert from 'node:assert/strict'
import State from '../state.js'

import runPipeline, { runPipelineAsync } from './index.js'

// Tests -- sync

test('should run pipeline', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = { pipelines }
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should continue pipeline with the same context', () => {
  const value = 'Entry 1' // We pretend we have gotten this value ...
  const context = [{ key: 'ent1', name: 'Entry 1' }] // ... from this context
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    '^', // Parent up to the outside context
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = new State({ pipelines, context })
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should not pass on flip to pipeline', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = { pipelines, flip: true }
  const expected = { id: 'ent1', title: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run pipeline on undefined', () => {
  const value = undefined
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    {
      type: 'alt',
      pipelines: [['name'], [{ type: 'value', value: 'No name' }]],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = { pipelines }
  const expected = 'No name'

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run recursive pipeline', () => {
  const value = {
    title: 'Comment 1',
    comments: [{ title: 'Comment 2' }, { title: 'Comment 3' }],
  }
  const pipeline = [{ type: 'apply' as const, id: 'comment' }]
  const commentPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['title', '>comment'],
        ['comments', { type: 'apply', id: 'comment', it: true }, '>children'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('comment', commentPipeline)
  const state = { pipelines }
  const expected = {
    comment: 'Comment 1',
    children: [
      { comment: 'Comment 2', children: undefined },
      { comment: 'Comment 3', children: undefined },
    ],
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should run pipeline in reverse', () => {
  const value = { id: 'ent1', title: 'Entry 1' }
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = { pipelines, rev: true }
  const expected = { key: 'ent1', name: 'Entry 1' }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should throw if pipeline is not found', () => {
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline = [{ type: 'apply' as const, id: 'unknown' }]
  const state = { pipelines: new Map() } // We set no pipeline
  const expectedError = new Error("Pipeline 'unknown' does not exist")

  assert.throws(() => runPipeline(value, pipeline, state), expectedError)
})

// Tests -- async

test('should run pipeline asynchronously', async () => {
  const fn = async () => 'From async'
  const value = { key: 'ent1', name: 'Entry 1' }
  const pipeline = [{ type: 'apply' as const, id: 'entry' }]
  const entryPipeline = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [{ type: 'transform' as const, fn }, '>asyncValue'],
      ],
    },
  ]
  const pipelines = new Map()
  pipelines.set('entry', entryPipeline)
  const state = { pipelines }
  const expected = { id: 'ent1', title: 'Entry 1', asyncValue: 'From async' }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})
