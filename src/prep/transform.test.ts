import test from 'ava'
import { isObject } from '../utils/is.js'
import type { Options, State } from '../types.js'

import preparePipeline from './index.js'

// Setup

const uppercaseFn = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val
const lowercaseFn = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toLowerCase() : val

const uppercase = () => () => uppercaseFn
const upperOrLower = (props: Record<string, unknown>) => () =>
  isObject(props) && props.case === 'lower' && !props.$iterate
    ? lowercaseFn
    : uppercaseFn
const lowerIfAlias = () => (options: Options) =>
  options.fwdAlias ? lowercaseFn : uppercaseFn

const options = {
  transformers: { uppercase, upperOrLower, lowerIfAlias },
}

// Tests

test('should prepare transform operation', (t) => {
  const def = {
    $transform: 'uppercase',
  }
  const expected = [{ type: 'transform', fn: uppercaseFn }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass props to transformer', (t) => {
  const def = {
    $transform: 'upperOrLower',
    case: 'lower', // This should give us the lowercase transformer
  }
  const expected = [{ type: 'transform', fn: lowercaseFn }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should not pass operation props to transformer', (t) => {
  const def = {
    $transform: 'upperOrLower',
    $iterate: true, // Should not be passed on
    case: 'lower', // This should give us the lowercase transformer, unless $iterate is passed to transformer
  }
  const expected = [{ type: 'transform', fn: lowercaseFn, it: true }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should pass options to transformer', (t) => {
  const def = { $transform: 'lowerIfAlias' }
  const optionsWithFwdAlias = { ...options, fwdAlias: 'from' } // Setting fwdAlias will give use the lowercase transformer in this weird test case
  const expected = [{ type: 'transform', fn: lowercaseFn }]

  const ret = preparePipeline(def, optionsWithFwdAlias)

  t.deepEqual(ret, expected)
})

test('should throw for unknown transformer function', (t) => {
  const def = {
    $transform: 'unknown',
  }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(
    error.message,
    "Transformer 'unknown' was not found for transform operation",
  )
})

test('should throw when no transformers', (t) => {
  const def = {
    $transform: 'uppercase',
  }
  const options = {} // No transformers

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(
    error.message,
    "Transformer 'uppercase' was not found for transform operation. No transformers",
  )
})

test('should throw when no transformer id', (t) => {
  const def = {
    $transform: '',
  }

  const error = t.throws(() => preparePipeline(def, options))

  t.true(error instanceof Error)
  t.is(error.message, 'Transform operation is missing transformer id')
})
