import test from 'ava'

import apply from './apply'

// Setup

const extractTitle = ['title']

const options = {
  pipelines: {
    extractTitle
  }
}

// Tests

test('should run pipeline by id', t => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' }
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1'
  }

  const ret = apply('extractTitle')(options)(state)

  t.deepEqual(ret, expected)
})

test('should run pipeline by id - in rev', t => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
    rev: true
  }

  const ret = apply('extractTitle')(options)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when pipieline is unknown', t => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' }
  }
  const expected = state

  const ret = apply('unknown')(options)(state)

  t.deepEqual(ret, expected)
})

test('should do nothing when no pipielines are supplied', t => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' }
  }
  const expected = state

  const ret = apply('extractTitle')({})(state)

  t.deepEqual(ret, expected)
})
