import test from 'ava'
import { get, set } from './getSet.js'
import pipe from './pipe.js'
import { noopNext } from '../utils/stateHelpers.js'
import type { Operation } from '../types.js'

import { fwd, rev, divide } from './directionals.js'

// Helpers

const upperCase = async (str: unknown) =>
  typeof str === 'string' ? str.toUpperCase() : str

const upper: Operation = (_options) => (next) => async (state) => ({
  ...(await next(state)),
  value: await upperCase((await next(state)).value),
})

const noop: Operation = () => () => async (state) => state

const options = {}

// Tests -- forward

test('should apply function when not rev', async (t) => {
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

  const ret = await fwd(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when rev', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }

  const ret = await fwd(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should apply function when rev and flip', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
    flip: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
    rev: true,
    flip: true,
  }

  const ret = await fwd(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in fwd', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: { title: 'Entry 1' },
    rev: false,
  }
  const expectedValue = 'Entry 1'

  const ret = await fwd('title')(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should apply in pipe', async (t) => {
  const def = [fwd(get('title')), fwd(set('heading'))]
  const state = {
    context: [],
    value: { title: 'Entry 1' },
    rev: false,
  }
  const expected = {
    context: [],
    value: { heading: 'Entry 1' },
    rev: false,
  }

  const ret = await pipe(def)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should apply function when rev', async (t) => {
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

  const ret = await rev(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when fwd', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: false,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: false,
  }

  const ret = await rev(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should apply function when not rev and flip', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: false,
    flip: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
    rev: false,
    flip: true,
  }

  const ret = await rev(upper)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in rev', async (t) => {
  const state = {
    context: [],
    value: 'Entry 1',
    rev: true,
  }
  const expectedValue = { title: 'Entry 1' }

  const ret = await rev('title')(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- divide

test('should apply first function when not rev', async (t) => {
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

  const ret = await divide(upper, noop)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should apply second function when rev', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
  }

  const ret = await divide(upper, noop)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should apply first function when rev and flip', async (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: 'Entry 1',
    rev: true,
    flip: true,
  }
  const expected = {
    context: [{ title: 'Entry 1' }],
    value: 'ENTRY 1',
    rev: true,
    flip: true,
  }

  const ret = await divide(upper, noop)(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})
