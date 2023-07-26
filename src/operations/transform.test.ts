import test from 'ava'
import sinon from 'sinon'
import { noopNext } from '../utils/stateHelpers.js'

import transform from './transform.js'

// Setup

const upper = () => async (str: unknown) =>
  typeof str === 'string' ? str.toUpperCase() : str
const lower = () => async (str: unknown) =>
  typeof str === 'string' ? str.toLowerCase() : str
const length = () => async (arr: unknown) => Array.isArray(arr) ? arr.length : 0

const options = {}

// Tests

test('should run transform function on value', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
  }

  const ret = await transform(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run transform function on array value', async (t) => {
  const state = {
    context: [[{ title: 'Entry 1' }, { title: 'Entry 2' }]],
    value: ['Entry 1', 'Entry 2'],
  }
  const expected = {
    context: [[{ title: 'Entry 1' }, { title: 'Entry 2' }]],
    value: 2,
  }

  const ret = await transform(length)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run transform in reverse', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
    rev: true,
  }

  const ret = await transform(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should run dedicated transform in reverse', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'entry 1',
    rev: true,
  }

  const ret = await transform(upper, lower)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not mind reverse transform going forward', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: false,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
    rev: false,
  }

  const ret = await transform(upper, lower)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should pass state to transform function', async (t) => {
  const fn = sinon.stub().returnsArg(0)
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: false,
    noDefaults: true,
  }
  const expected = state

  await transform(() => fn)(options)(noopNext)(state)

  t.deepEqual(fn.args[0][1], expected)
})

test('should pass state to rev transform function', async (t) => {
  const fn = sinon.stub().returnsArg(0)
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
    noDefaults: false,
  }
  const expected = state

  await transform(upper, () => fn)(options)(noopNext)(state)

  t.deepEqual(fn.args[0][1], expected)
})

test('should throw when given something other than a function', (t) => {
  const state = {
    context: [{}],
    value: 'Entry 1',
  }

  const error = t.throws(
    () => transform('wrong' as any)(options)(noopNext)(state) // eslint-disable-line @typescript-eslint/no-explicit-any
  )

  t.true(error instanceof Error)
  t.is(
    error?.message,
    'Transform operation was called without a valid transformer function'
  )
})
