import test from 'ava'
import { set } from './getSet.js'
import iterate from './iterate.js'
import { noopNext } from '../utils/stateHelpers.js'

import apply from './apply.js'

// Setup

const extractTitle = ['title']
const renameTitle = [{ headline: 'title' }, { headline: 'headline' }]
const setTitle = [set('title')]
const recursive = [
  { id: 'key', comments: ['children[]', iterate(apply('recursive'))] },
]

const options = {
  pipelines: {
    extractTitle,
    renameTitle,
    setTitle,
    recursive,
  },
}

// Tests

test('should run pipeline by id', async (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: 'Entry 1',
  }

  const ret = await apply('extractTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline by id - in rev', async (t) => {
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

  const ret = await apply('extractTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id', async (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const ret = await apply('renameTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id - in rev', async (t) => {
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

  const ret = await apply('renameTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip', async (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
    flip: true,
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const ret = await apply('renameTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip - in rev', async (t) => {
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

  const ret = await apply('renameTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline on undefined', async (t) => {
  const state = {
    context: [],
    value: undefined,
  }
  const expected = {
    context: [],
    value: { title: undefined },
  }

  const ret = await apply('setTitle')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run recursive pipeline', async (t) => {
  const state = {
    context: [],
    value: { key: 'ent1', children: [{ key: 'ent2' }] },
  }
  const expected = {
    context: [],
    value: { id: 'ent1', comments: [{ id: 'ent2', comments: [] }] },
  }

  const ret = await apply('recursive')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should throw when given an unknown pipeline id', (t) => {
  const error = t.throws(() => apply('unknown')(options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when not given a pipeline id', (t) => {
  const error = t.throws(
    () => apply(undefined as any)(options) // eslint-disable-line @typescript-eslint/no-explicit-any
  )

  t.true(error instanceof Error)
  t.is(error?.message, 'Failed to apply pipeline. No id provided')
})
