import test from 'ava'
import { set } from './getSet.js'
import { identity } from '../utils/functional.js'

import apply from './apply.js'

// Setup

const extractTitle = ['title']
const renameTitle = [{ headline: 'title' }, { headline: 'headline' }]
const setTitle = [set('title')]

const options = {
  pipelines: {
    extractTitle,
    renameTitle,
    setTitle,
  },
}

// Tests

test('should run pipeline by id', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: 'Entry 1',
  }

  const ret = apply('extractTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline by id - in rev', (t) => {
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

  const ret = apply('extractTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const ret = apply('renameTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run object pipeline by id - in rev', (t) => {
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

  const ret = apply('renameTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
    flip: true,
  }
  const expected = {
    context: [],
    value: { headline: 'Entry 1' },
  }

  const ret = apply('renameTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not pass on flip - in rev', (t) => {
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

  const ret = apply('renameTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline on undefined', (t) => {
  const state = {
    context: [],
    value: undefined,
  }
  const expected = {
    context: [],
    value: { title: undefined },
  }

  const ret = apply('setTitle')(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should throw when given an unknown pipeline id', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const error = t.throws(() => apply('unknown')(options)(identity)(state))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when not given a pipeline id', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const error = t.throws(
    () => apply(undefined as any)(options)(identity)(state) // eslint-disable-line @typescript-eslint/no-explicit-any
  )

  t.true(error instanceof Error)
  t.is(error?.message, 'Failed to apply pipeline. No id provided')
})
