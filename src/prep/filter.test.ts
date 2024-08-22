import test from 'ava'
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

test('should prepare filter operation', (t) => {
  const def = { $filter: 'isTrue' }
  const expected = [{ type: 'filter' as const, fn: isTrueFn }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass props to transformer', (t) => {
  const def = {
    $filter: 'isTrueOrFalse',
    bool: 'false', // This should give us the isFalse transformer
  }
  const expected = [{ type: 'filter', fn: isFalseFn }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass options to transformer', (t) => {
  const def = { $filter: 'isTrueOrFalse' }
  const optionsWithFwdAlias = { ...options, fwdAlias: 'from' } // Setting fwdAlias will give use the isFalse transformer in this weird test case
  const expected = [{ type: 'filter', fn: isFalseFn }]

  const ret = preparePipeline(def, optionsWithFwdAlias)

  t.deepEqual(ret, expected)
})

test('should throw for unknown transformer function', (t) => {
  const def = {
    $filter: 'unknown',
  }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(
    error.message,
    "Transformer 'unknown' was not found for filter operation",
  )
})

test('should throw when no transformers', (t) => {
  const def = {
    $filter: 'uppercase',
  }
  const options = {} // No transformers

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(
    error.message,
    "Transformer 'uppercase' was not found for filter operation. No transformers",
  )
})

test('should throw when no transformer id', (t) => {
  const def = {
    $filter: '',
  }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(error.message, 'Filter operation is missing transformer id')
})
