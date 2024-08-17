import test from 'ava'
import type { State } from '../types.js'
import type { PreppedPipeline } from '../run/index.js'

import preparePipeline from './index.js'

// Setup

const uppercaseFn = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val
const uppercase = () => () => uppercaseFn

const options = {
  transformers: { uppercase },
  fwdAlias: 'from',
  revAlias: 'to',
}

// Tests

test('should prepare pipeline', (t) => {
  const def = ['data.name', { $transform: 'uppercase' }, '>items[].title']
  const expected = [
    'data',
    'name',
    { type: 'transform', fn: uppercaseFn },
    '>title',
    '>[]',
    '>items',
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare pipeline with sub-pipeline', (t) => {
  const def = ['data', ['name', { $transform: 'uppercase' }], '>items[].title']
  const expected = [
    'data',
    'name',
    { type: 'transform', fn: uppercaseFn },
    '>title',
    '>[]',
    '>items',
  ]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should return empty pipeline when no def', (t) => {
  const def = null
  const expected: PreppedPipeline = []

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare transform operation with iteration', (t) => {
  const def = [
    {
      $transform: 'uppercase',
      $iterate: true,
    },
  ]
  const expected = [{ type: 'transform', fn: uppercaseFn, it: true }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare transform operation with direction fwd', (t) => {
  const def = {
    $transform: 'uppercase',
    $direction: 'fwd',
    $iterate: true,
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: 1, it: true }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare transform operation with direction rev', (t) => {
  const def = {
    $transform: 'uppercase',
    $direction: 'rev',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: -1 }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare transform operation with direction set to fwdAlias', (t) => {
  const def = {
    $transform: 'uppercase',
    $direction: 'from',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: 1 }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should prepare transform operation with direction revAlias', (t) => {
  const def = {
    $transform: 'uppercase',
    $direction: 'to',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: -1 }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})
