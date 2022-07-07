import test from 'ava'
import { set } from './getSet'

import apply from './apply'

// Setup

const extractTitle = ['title']
const setTitle = [set('title')]

const options = {
  pipelines: {
    extractTitle,
    setTitle,
  },
}

// Tests

test('should run pipeline by id', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
  }

  const ret = apply('extractTitle')(options)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline by id - in rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
    rev: true,
  }

  const ret = apply('extractTitle')(options)(state)

  t.deepEqual(ret, expected)
})

test('should return value untouched when pipieline is unknown', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
  }

  const ret = apply('unknown')(options)(state)

  t.deepEqual(ret.value, { title: 'Entry 1' })
})

test('should return value when no pipielines are supplied', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
  }

  const ret = apply('extractTitle')({})(state)

  t.deepEqual(ret.value, { title: 'Entry 1' })
})

test('should run pipeline on undefined', (t) => {
  const state = {
    root: undefined,
    context: undefined,
    value: undefined,
  }
  const expected = {
    root: undefined,
    context: undefined,
    value: { title: undefined },
  }

  const ret = apply('setTitle')(options)(state)

  t.deepEqual(ret, expected)
})
