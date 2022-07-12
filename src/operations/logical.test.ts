import test from 'ava'
import compare from '../functions/compare'

import { and, or } from './logical'

// Setup

const options = {
  functions: { compare },
}

// Tests -- and

test('should run pipelines and logical AND them - with result true', (t) => {
  const def0 = { $filter: 'compare', path: 'a', match: 1 }
  const def1 = { $filter: 'compare', path: 'b', match: 2 }
  const state = {
    root: {},
    context: {},
    value: { a: 1, b: 2 },
  }
  const expected = {
    root: {},
    context: {},
    value: true,
  }

  const ret = and(def0, def1)(options)(state)

  t.deepEqual(ret, expected)
})

test('should run pipelines and logical AND them - with result false', (t) => {
  const def0 = { $filter: 'compare', path: 'a', match: 1 }
  const def1 = { $filter: 'compare', path: 'b', match: 3 } // Not matched
  const state = {
    root: {},
    context: {},
    value: { a: 1, b: 2 },
  }

  const ret = and(def0, def1)(options)(state)

  t.false(ret.value)
})

// Tests -- or

test('should run pipelines and logical OR them - with result true', (t) => {
  const def0 = { $filter: 'compare', path: 'a', match: 1 }
  const def1 = { $filter: 'compare', path: 'b', match: 3 } // Not matched
  const state = {
    root: {},
    context: {},
    value: { a: 1, b: 2 },
  }
  const expected = {
    root: {},
    context: {},
    value: true,
  }

  const ret = or(def0, def1)(options)(state)

  t.deepEqual(ret, expected)
})

test('should run pipelines and logical OR them - with result false', (t) => {
  const def0 = { $filter: 'compare', path: 'a', match: 2 } // Not matched
  const def1 = { $filter: 'compare', path: 'b', match: 3 } // Not matched
  const state = {
    root: {},
    context: {},
    value: { a: 1, b: 2 },
  }

  const ret = or(def0, def1)(options)(state)

  t.false(ret.value)
})
