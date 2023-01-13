import test from 'ava'
import { get, set } from './getSet.js'
import pipe from './pipe.js'
import { identity } from '../utils/functional.js'
import { Operation } from '../types.js'

import { fwd, rev, divide } from './directionals.js'

// Helpers

const upperCase = (str: unknown) =>
  typeof str === 'string' ? str.toUpperCase() : str

const upper: Operation = (_options) => (next) => (state) => ({
  ...next(state),
  value: upperCase(next(state).value),
})

const options = {}

// Tests -- forward

test('should apply function when not rev', (t) => {
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

  const ret = fwd(upper)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when rev', (t) => {
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

  const ret = fwd(upper)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in fwd', (t) => {
  const state = {
    context: [{ title: 'Entry 1' }],
    value: { title: 'Entry 1' },
    rev: false,
  }
  const expectedValue = 'Entry 1'

  const ret = fwd('title')(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should apply in pipe', (t) => {
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

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should apply function when rev', (t) => {
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

  const ret = rev(upper)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when fwd', (t) => {
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

  const ret = rev(upper)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in rev', (t) => {
  const state = {
    context: [],
    value: 'Entry 1',
    rev: true,
  }
  const expectedValue = { title: 'Entry 1' }

  const ret = rev('title')(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- divide

test('should apply first function when not rev', (t) => {
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

  const ret = divide(upper, () => identity)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should apply second function when rev', (t) => {
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

  const ret = divide(upper, () => identity)(options)(identity)(state)

  t.deepEqual(ret, expected)
})
