import test from 'node:test'
import assert from 'node:assert/strict'

import runPipeline, { runPipelineAsync, PreppedPipeline } from './index.js'

// Setup

const state = { rev: false }
const stateRev = { rev: true }

// Tests -- sync

test('should generate an array from the given pipelines', () => {
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
    },
  ]
  const expected = ['Entry 1', 'The real name', 'Third']

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should keep undefined', () => {
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['unknown'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
    },
  ]
  const expected = ['Entry 1', undefined, 'Third']

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return empty array when no pipelines', () => {
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [],
    },
  ]
  const expected: unknown[] = []

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should support parent in pipeline', () => {
  const value = { id: 'ent1', name: 'Parent name', props: { title: 'Entry 1' } }
  const pipeline: PreppedPipeline = [
    'props',
    {
      type: 'array',
      pipelines: [['^', 'name'], ['title']],
    },
  ]
  const state = {
    context: [{ item: { id: 'ent1', props: { title: 'Entry 1' } } }],
  }
  const expected = ['Parent name', 'Entry 1']

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should support iterating', () => {
  const value = [
    {
      id: 'ent1',
      title: 'Entry 1',
      name: 'The real name',
    },
    {
      id: 'ent2',
      title: 'Entry 2',
    },
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [['title'], ['name']],
      it: true,
    },
  ]
  const expected = [
    ['Entry 1', 'The real name'],
    ['Entry 2', undefined],
  ]

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should generate an array from the given pipelines when flipped in reverse', () => {
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
      flip: true,
    },
  ]
  const expected = ['Entry 1', 'The real name', 'Third']

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible in reverse', () => {
  const value = ['Entry 1', 'The real name']
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
      ],
    },
  ]
  const expected = {
    title: 'Entry 1',
    props: { name: 'The real name' },
  }

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible when flipped going forward', () => {
  const value = ['Entry 1', 'The real name']
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
      ],
      flip: true,
    },
  ]
  const expected = {
    title: 'Entry 1',
    props: { name: 'The real name' },
  }

  const ret = runPipeline(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when no pipelines in reverse', () => {
  const value: unknown[] = []
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [],
    },
  ]
  const expected = undefined

  const ret = runPipeline(value, pipeline, stateRev)

  assert.equal(ret, expected)
})

test('should recreate the original data when iterating in reverse', () => {
  const value = [
    ['Entry 1', 'The real name'],
    ['Entry 2', undefined],
  ]
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn: String }],
        ['props', 'name'],
      ],
      it: true,
    },
  ]
  const expected = [
    {
      title: 'Entry 1',
      props: { name: 'The real name' },
    },
    {
      title: 'Entry 2',
      props: { name: undefined },
    },
  ]

  const ret = runPipeline(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

// Tests -- async

test('should generate an array from the given async pipelines', async () => {
  const fn = async () => 'From async'
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        [{ type: 'transform', fn }],
        ['props', 'name'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
    },
  ]
  const expected = ['From async', 'The real name', 'Third']

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible in reverse async', async () => {
  const fn = async () => 'From async'
  const value = [undefined, 'The real name']
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn }],
        ['props', 'name'],
      ],
    },
  ]
  const expected = {
    title: 'From async',
    props: { name: 'The real name' },
  }

  const ret = await runPipelineAsync(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should generate an array from the given async pipelines when flipped in reverse', async () => {
  const fn = async () => 'From async'
  const value = {
    id: 'ent1',
    title: 'Entry 1',
    props: { name: 'The real name' },
  }
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        [{ type: 'transform', fn }],
        ['props', 'name'],
        [{ type: 'value', value: 'Third', fixed: false }],
      ],
      flip: true,
    },
  ]
  const expected = ['From async', 'The real name', 'Third']

  const ret = await runPipelineAsync(value, pipeline, stateRev)

  assert.deepEqual(ret, expected)
})

test('should recreate the original data as far as possible when flipped going forward async', async () => {
  const fn = async () => 'From async'
  const value = [undefined, 'The real name']
  const pipeline: PreppedPipeline = [
    {
      type: 'array' as const,
      pipelines: [
        ['title', { type: 'transform', fn }],
        ['props', 'name'],
      ],
      flip: true,
    },
  ]
  const expected = {
    title: 'From async',
    props: { name: 'The real name' },
  }

  const ret = await runPipelineAsync(value, pipeline, state)

  assert.deepEqual(ret, expected)
})

test.todo('should skip pipelines with $value in reverse')
