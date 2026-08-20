import test from 'node:test'
import assert from 'node:assert/strict'
import { set } from './getSet.js'
import iterate from './iterate.js'
import { noopNext } from '../utils/stateHelpers.js'
import { prepareOptions, preparePipelines } from '../utils/prepareOptions.js'
import type { InternalOptions, Options } from '../types.js'

import apply from './apply.js'

// Setup

const extractTitle = ['title']
const renameTitle = [{ headline: 'title' }, { headline: 'headline' }]
const setTitle = [set('title')]
const recursive = [
  { id: 'key', comments: ['children[]', iterate(apply('recursive'))] },
]

// We need a fresh options for every test, as there are side effects
const createOptions = () =>
  prepareOptions({
    pipelines: {
      extractTitle,
      renameTitle,
      setTitle,
      recursive,
    },
  })

// Tests

test('should run pipeline by id', async () => {
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

  assert.deepEqual(ret, expected)
  assert.ok(options.neededPipelineIds?.has('extractTitle'))
})

test('should run pipeline by id - in rev', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should run object pipeline by id', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should run object pipeline by id - in rev', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should not pass on flip', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should not pass on flip - in rev', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should run pipeline on undefined', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should run recursive pipeline', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should mark pipeline as needed', async () => {
  const options = createOptions()
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  await stateMapper(state)

  assert.equal(options.neededPipelineIds?.size, 1)
  assert.ok(options.neededPipelineIds?.has('extractTitle'))
})

test('should mark pipeline as needed when others has already been marked', async () => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const options: InternalOptions = {
    ...createOptions(),
    neededPipelineIds: new Set(),
  }
  options.neededPipelineIds?.add('setTitle')

  const stateMapper = apply('extractTitle')(options)(noopNext)
  preparePipelines(options)
  await stateMapper(state)

  assert.equal(options.neededPipelineIds?.size, 2)
  assert.ok(options.neededPipelineIds?.has('extractTitle'))
  assert.ok(options.neededPipelineIds?.has('setTitle'))
})

test('should mark pipeline as needed on options that are not prepared', async () => {
  const options: Options = { pipelines: { extractTitle } }
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: 'Entry 1',
  }

  const stateMapper = apply('extractTitle')(options)(noopNext)
  const ret = await stateMapper(state)

  assert.deepEqual(ret, expected)
  // The book-keeping props are set on the options object we were given
  assert.ok(options.neededPipelineIds?.has('extractTitle'))
  assert.ok(options.preparedPipelines?.has('extractTitle'))
})

test('should throw when given an unknown pipeline id', () => {
  const options = createOptions()
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. Unknown pipeline",
  )

  assert.throws(() => apply('unknown')(options), expectedError)
})

test('should throw when not given a pipeline id', () => {
  const options = createOptions()
  const expectedError = new Error('Failed to apply pipeline. No id provided')

  assert.throws(
    () => apply(undefined as any)(options), // eslint-disable-line @typescript-eslint/no-explicit-any
    expectedError,
  )
})

test('should throw when no pipelines', () => {
  const options = {}
  const expectedError = new Error(
    "Failed to apply pipeline 'unknown'. No pipelines",
  )

  assert.throws(() => apply('unknown')(options), expectedError)
})
