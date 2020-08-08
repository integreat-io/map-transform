import test from 'ava'
import { identity } from 'ramda'
import { MapFunction, Options } from '../types'

import { fwd, rev, divide } from './directionals'

// Helpers

const upperCase = (str: unknown) =>
  typeof str === 'string' ? str.toUpperCase() : str

const upper: MapFunction = (_options: Options) => (state) => ({
  ...state,
  value: upperCase(state.value),
})

const options = {}

// Tests -- forward

test('should apply function when not rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: false,
  }

  const ret = fwd(upper)(options)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }

  const ret = fwd(upper)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in fwd', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
    rev: false,
  }
  const expectedValue = 'Entry 1'

  const ret = fwd('title')(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- reverse

test('should apply function when rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: true,
  }

  const ret = rev(upper)(options)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when fwd', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false,
  }

  const ret = rev(upper)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in rev', (t) => {
  const state = {
    root: 'Entry 1',
    context: 'Entry 1',
    value: 'Entry 1',
    rev: true,
  }
  const expectedValue = { title: 'Entry 1' }

  const ret = rev('title')(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- divide

test('should apply first function when not rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: false,
  }

  const ret = divide(upper, () => identity)(options)(state)

  t.deepEqual(ret, expected)
})

test('should apply second function when rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true,
  }

  const ret = divide(upper, () => identity)(options)(state)

  t.deepEqual(ret, expected)
})
