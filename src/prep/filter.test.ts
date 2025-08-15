import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../utils/is.js'
import type { Options } from '../types.js'

import preparePipeline from './index.js'

// Setup

const isTrueFn = () => true
const isFalseFn = () => true
const notFn = (value: unknown) => !value

const isTrue = () => () => isTrueFn
const isTrueOrFalse = (props: Record<string, unknown>) => (options: Options) =>
  (isObject(props) && props.bool === 'false') || options.fwdAlias === 'from'
    ? isFalseFn
    : isTrueFn
const not = () => () => notFn

const options = {
  transformers: { isTrue, isTrueOrFalse, not },
}

// Tests -- transformer variant

test('should prepare filter operation', () => {
  const def = { $filter: 'isTrue' }
  const expected = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isTrueFn }],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass props to transformer', () => {
  const def = {
    $filter: 'isTrueOrFalse',
    bool: 'false', // This should give us the isFalse transformer -- happens in the preparation of the transformer
  }
  const expected = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isFalseFn }],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass options to transformer', () => {
  const def = { $filter: 'isTrueOrFalse' }
  const optionsWithFwdAlias = { ...options, fwdAlias: 'from' } // Setting fwdAlias will give use the isFalse transformer in this weird test case
  const expected = [
    {
      type: 'filter' as const,
      pipeline: [{ type: 'transform' as const, fn: isFalseFn }],
    },
  ]

  const ret = preparePipeline(def, optionsWithFwdAlias)

  assert.deepEqual(ret, expected)
})

test('should throw for unknown transformer function', () => {
  const def = {
    $filter: 'unknown',
  }
  const expectedError = new Error(
    "Transformer 'unknown' was not found for filter operation",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})

test('should throw when no transformers', () => {
  const def = {
    $filter: 'uppercase',
  }
  const options = {} // No transformers
  const expectedError = new Error(
    "Transformer 'uppercase' was not found for filter operation. No transformers",
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})

test('should throw when no transformer id', () => {
  const def = {
    $filter: '',
  }
  const expectedError = new Error(
    'Filter operation is missing transformer id or pipeline',
  )

  assert.throws(() => preparePipeline(def, options), expectedError)
})

// Tests -- pipeline variant

test('should prepare filter operation with a pipeline', () => {
  const def = { $filter: ['meta.archived', { $transform: 'not' }] }
  const expected = [
    {
      type: 'filter' as const,
      pipeline: ['meta', 'archived', { type: 'transform' as const, fn: notFn }],
    },
  ]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})
