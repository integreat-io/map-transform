import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../utils/is.js'
import type { Options } from '../types.js'

import preparePipeline from './index.js'

// Setup

const isTrueFn = () => true
const isFalseFn = () => true

const isTrue = () => () => isTrueFn
const isTrueOrFalse = (props: Record<string, unknown>) => (options: Options) =>
  (isObject(props) && props.bool === 'false') || options.fwdAlias === 'from'
    ? isFalseFn
    : isTrueFn

const options = {
  transformers: { isTrue, isTrueOrFalse },
}

// Tests

test('should prepare filter operation', () => {
  const def = { $filter: 'isTrue' }
  const expected = [{ type: 'filter' as const, fn: isTrueFn }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass props to transformer', () => {
  const def = {
    $filter: 'isTrueOrFalse',
    bool: 'false', // This should give us the isFalse transformer
  }
  const expected = [{ type: 'filter', fn: isFalseFn }]

  const ret = preparePipeline(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass options to transformer', () => {
  const def = { $filter: 'isTrueOrFalse' }
  const optionsWithFwdAlias = { ...options, fwdAlias: 'from' } // Setting fwdAlias will give use the isFalse transformer in this weird test case
  const expected = [{ type: 'filter', fn: isFalseFn }]

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
  const expectedError = new Error('Filter operation is missing transformer id')

  assert.throws(() => preparePipeline(def, options), expectedError)
})
