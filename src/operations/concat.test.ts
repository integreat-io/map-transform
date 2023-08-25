import test from 'ava'
import transform from './transform.js'
import { value } from '../transformers/value.js'
import { noopNext } from '../utils/stateHelpers.js'

import concat from './concat.js'

// Setup

const options = {}

// Tests -- forward

test('should just pass on state when given one pipeline', async (t) => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = {
    context: [],
    value: ['johnf', 'maryk'],
  }

  const ret = await concat('users[]')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should merge arrays from several pipelines', async (t) => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expectedValue = ['johnf', 'maryk', 'theboss']

  const ret = await concat('users[]', 'admins[]')(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should merge strings from several pipelines into array', async (t) => {
  const state = {
    context: [],
    value: { group: 'bergen', user: 'johnf' },
  }
  const expectedValue = ['bergen', '-', 'johnf']

  const ret = await concat('group', transform(value('-')), 'user')(options)(
    noopNext
  )(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should return empty array when no pipelines', async (t) => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = {
    context: [],
    value: [],
  }

  const ret = await concat()(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should strip away undefined', async (t) => {
  const state = {
    context: [],
    value: { group: 'bergen', user: 'johnf', team: null },
  }
  const expectedValue = ['bergen', 'johnf', null]

  const ret = await concat('group', 'unknown', 'user', 'team')(options)(
    noopNext
  )(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- reverse

test('should set array on one prop in reverse', async (t) => {
  const state = {
    context: [],
    value: ['johnf', 'maryk'],
    rev: true,
  }
  const expected = {
    context: [],
    value: { users: ['johnf', 'maryk'] },
    rev: true,
  }

  const ret = await concat('users[]')(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set array on first prop in reverse', async (t) => {
  const state = {
    context: [],
    value: ['johnf', 'maryk', 'theboss'],
    rev: true,
  }
  const expectedValue = {
    users: ['johnf', 'maryk', 'theboss'],
    admins: [],
  }

  const ret = await concat('users[]', 'admins[]')(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should return an empty object when no pipelines in reverse', async (t) => {
  const state = {
    context: [],
    value: ['johnf', 'maryk'],
    rev: true,
  }
  const expected = {
    context: [],
    value: {},
    rev: true,
  }

  const ret = await concat()(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})
