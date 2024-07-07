import test from 'ava'
import { set } from './getSet.js'
import iterate from './iterate.js'
import { noopNext } from '../utils/stateHelpers.js'
import { preparePipelines } from '../utils/prepareOptions.js'
import type { Options } from '../types.js'

import apply from './apply.js'

// Setup

const extractTitle = ['title']
const renameTitle = [{ headline: 'title' }, { headline: 'headline' }]
const setTitle = [set('title')]
const recursive = [
  { id: 'key', comments: ['children[]', iterate(apply('recursive'))] },
]

// We need a fresh options for every test, as there are side effects
const createOptions = (): Options => ({
  pipelines: {
    extractTitle,
    renameTitle,
    setTitle,
    recursive,
  },
})

// Tests

test('should run pipeline by id', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: 'Entry 1',
  }

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
  t.true(options.neededPipelineIds?.has('extractTitle'))
})

test('should run pipeline by id - in rev', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    context: [],
    value: { title: 'Entry 1' },
    rev: true,
  }

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const stateMapper = apply('renameTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id - in rev', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { headline: 'Entry 1' },
    rev: true,
  }
  const expected = {
    context: [],
    value: { title: 'Entry 1' },
    rev: true,
  }

  const stateMapper = apply('renameTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { title: 'Entry 1' },
    flip: true,
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const stateMapper = apply('renameTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip - in rev', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { headline: 'Entry 1' },
    rev: true,
    flip: true,
  }
  const expected = {
    context: [],
    value: { title: 'Entry 1' },
    rev: true,
  }

  const stateMapper = apply('renameTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline on undefined', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: undefined,
  }
  const expected = {
    context: [],
    value: { title: undefined },
  }

  const stateMapper = apply('setTitle')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should run recursive pipeline', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { key: 'ent1', children: [{ key: 'ent2' }] },
  }
  const expected = {
    context: [],
    value: { id: 'ent1', comments: [{ id: 'ent2', comments: [] }] },
  }

  const stateMapper = apply('recursive')(options)(noopNext)
  preparePipelines(options)
  const ret = await stateMapper(state)

  t.deepEqual(ret, expected)
})

test('should mark pipeline as needed', async (t) => {
  const options = createOptions()
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  await stateMapper(state)

  t.is(options.neededPipelineIds?.size, 1)
  t.true(options.neededPipelineIds?.has('extractTitle'))
})

test('should mark pipeline as needed when others has already been marked', async (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const options: Options = {
    ...createOptions(),
    neededPipelineIds: new Set(),
  }
  options.neededPipelineIds?.add('setTitle')

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  await stateMapper(state)

  t.is(options.neededPipelineIds?.size, 2)
  t.true(options.neededPipelineIds?.has('extractTitle'))
  t.true(options.neededPipelineIds?.has('setTitle'))
})

test('should throw when given an unknown pipeline id', (t) => {
  const options = createOptions()
  const error = t.throws(() => apply('unknown')(options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when not given a pipeline id', (t) => {
  const options = createOptions()
  const error = t.throws(
    () => apply(undefined as any)(options), // eslint-disable-line @typescript-eslint/no-explicit-any
  )

  t.true(error instanceof Error)
  t.is(error?.message, 'Failed to apply pipeline. No id provided')
})

test('should throw when no pipelines', (t) => {
  const options = {}
  const error = t.throws(() => apply('unknown')(options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. No pipelines")
})
