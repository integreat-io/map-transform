import test from 'node:test'
import assert from 'node:assert/strict'
import type { State } from '../types.js'
import type { PreppedPipeline } from '../run/index.js'

import preparePipeline, { TransformDefinition } from './index.js'

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

test('should prepare pipeline', () => {
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

  assert.deepEqual(ret, expected)
})

test('should prepare pipeline with sub-pipeline', () => {
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

  assert.deepEqual(ret, expected)
})

test('should return empty pipeline when no def', () => {
  const def = null
  const expected: PreppedPipeline = []

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should skip null in pipeline', () => {
  const def = [null] as unknown as TransformDefinition
  const expected: PreppedPipeline = []

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare transform operation with iteration', () => {
  const def = [
    {
      $transform: 'uppercase',
      $iterate: true,
    },
  ]
  const expected = [{ type: 'transform', fn: uppercaseFn, it: true }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare transform operation with direction fwd', () => {
  const def = {
    $transform: 'uppercase',
    $direction: 'fwd',
    $iterate: true,
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: 1, it: true }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare transform operation with direction rev', () => {
  const def = {
    $transform: 'uppercase',
    $direction: 'rev',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: -1 }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare transform operation with direction set to fwdAlias', () => {
  const def = {
    $transform: 'uppercase',
    $direction: 'from',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: 1 }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare transform operation with direction revAlias', () => {
  const def = {
    $transform: 'uppercase',
    $direction: 'to',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn, dir: -1 }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should throw when pipeline has a function (old operation)', () => {
  const def = [
    'data.name',
    () => () => () => undefined,
    '>items[].title',
  ] as unknown as TransformDefinition // We know we are providing something invalid, but need to override the typing errors
  const expectedError = new Error(
    'Operation functions are not supported anymore',
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})
