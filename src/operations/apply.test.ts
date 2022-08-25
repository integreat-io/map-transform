import test from 'ava'
import { set } from './getSet'
import { identity } from '../utils/functional'

import apply from './apply'

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
    context: [{ title: 'Entry 1' }],
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

test('should return value untouched when pipeline is unknown', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const ret = apply('unknown')(options)(identity)(state)

  t.deepEqual(ret.value, { title: 'Entry 1' })
})

test('should return value when no pipielines are supplied', (t) => {
  const state = {
    context: [],
    value: { title: 'Entry 1' },
  }

  const ret = apply('extractTitle')({})(identity)(state)

  t.deepEqual(ret.value, { title: 'Entry 1' })
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
