import test from 'ava'
import { not } from './notNext.js'
import type { Transformer, AsyncTransformer } from '../types.js'

import { logical, logicalAsync } from './logicalNext.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Test -- forward

test('should do a logical AND on the given paths -- and return false', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: true, meta: { published: false }, public: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, state)

  t.false(ret)
})

test('should do a logical AND on the given paths -- and return true', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: true, meta: { published: true }, public: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, state)

  t.true(ret)
})

test('should do a logical OR on the given paths -- and return false', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: false }, public: false }

  const ret = logical({ path, operator: 'OR' })(options)(data, state)

  t.false(ret)
})

test('should do a logical OR on the given paths -- and return true', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: true }, public: false }

  const ret = logical({ path, operator: 'OR' })(options)(data, state)

  t.true(ret)
})

test('should force values to boolean -- going forward', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = {
    visible: false,
    meta: { published: new Date() },
    public: false,
  }

  const ret = logical({ path, operator: 'OR' })(options)(data, state)

  t.true(ret)
})

test('should do a logical OR on the given paths -- using the root', (t) => {
  const stateWithRoot = { ...state, context: [{ acceptAll: true }] }
  const path = ['^^.acceptAll', 'visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: false }, public: false }

  const ret = logical({ path, operator: 'OR' })(options)(data, stateWithRoot)

  t.true(ret)
})

test('should support full pipelines', (t) => {
  const getFalse: Transformer = () => () => () => false
  const path = ['visible', 'public', { $transform: 'getFalse' }]
  const data = { visible: true, public: true }
  const options = { transformers: { getFalse } }

  const ret = logical({ path, operator: 'AND' })(options)(data, state)

  t.false(ret)
})

test('should return the boolean as is from AND with only one path', (t) => {
  const path = 'visible'
  const data = { visible: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, state)

  t.true(ret)
})

test('should return the boolean as is from OR with only one path', (t) => {
  const path = 'visible'
  const data = { visible: true }

  const ret = logical({ path, operator: 'OR' })(options)(data, state)

  t.true(ret)
})

// Tests -- reverse

test('should set all paths to the given boolean value', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = true
  const expected = { visible: true, meta: { published: true }, public: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should force value to boolean -- in reverse', (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { what: false }
  const expected = { visible: true, meta: { published: true }, public: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should support full pipelines in reverse', (t) => {
  const getFalse: Transformer = () => () => () => false
  const path = ['visible', { $transform: 'getFalse' }, 'public']
  const data = true
  const options = { transformers: { getFalse } }
  const expected = { visible: true, public: true }

  const ret = logical({ path, operator: 'AND' })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

// Tests -- async

test('should do a logical AND on the given paths async', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: true, meta: { published: false }, public: true }

  const ret = await logicalAsync({ path, operator: 'AND' })(options)(
    data,
    state,
  )

  t.false(ret)
})

test('should do a logical OR on the given paths async', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = { visible: false, meta: { published: false }, public: false }

  const ret = await logicalAsync({ path, operator: 'OR' })(options)(data, state)

  t.false(ret)
})

test('should set all paths to the given boolean value async', async (t) => {
  const path = ['visible', 'meta.published', 'public']
  const data = true
  const expected = { visible: true, meta: { published: true }, public: true }

  const ret = await logicalAsync({ path, operator: 'AND' })(options)(
    data,
    stateRev,
  )

  t.deepEqual(ret, expected)
})

test('should support full async pipelines', async (t) => {
  const getFalse: AsyncTransformer = () => () => async () => false
  const path = [
    'visible',
    'public',
    [{ $transform: 'getFalse' }, { $transform: 'not' }],
  ]
  const data = { visible: true, public: true }
  const options = { transformers: { getFalse, not } }

  const ret = await logicalAsync({ path, operator: 'AND' })(options)(
    data,
    state,
  )

  t.true(ret)
})
