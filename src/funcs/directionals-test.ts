import test from 'ava'
import { MapFunction } from '../types'

import { fwd, rev } from './directionals'

// Helpers

const upperCase = (str: string | any) => (typeof str === 'string') ? str.toUpperCase() : str
const upper: MapFunction = (state) => ({ ...state, value: upperCase(state.value) })

// Tests -- forward

test('should apply function when not rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: false
  }

  const ret = fwd(upper)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }

  const ret = fwd(upper)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in fwd', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: { title: 'Entry 1' },
    rev: false
  }
  const expectedValue = 'Entry 1'

  const ret = fwd('title')(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- reverse

test('should apply function when rev', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: true
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'ENTRY 1',
    rev: true
  }

  const ret = rev(upper)(state)

  t.deepEqual(ret, expected)
})

test('should not apply function when fwd', (t) => {
  const state = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false
  }
  const expected = {
    root: { title: 'Entry 1' },
    context: { title: 'Entry 1' },
    value: 'Entry 1',
    rev: false
  }

  const ret = rev(upper)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as get path in rev', (t) => {
  const state = {
    root: 'Entry 1',
    context: 'Entry 1',
    value: 'Entry 1',
    rev: true
  }
  const expectedValue = { title: 'Entry 1' }

  const ret = rev('title')(state)

  t.deepEqual(ret.value, expectedValue)
})
