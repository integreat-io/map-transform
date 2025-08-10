import test from 'node:test'
import assert from 'node:assert/strict'
import transform from './transform.js'
import { value } from '../transformers/value.js'
import { noopNext } from '../utils/stateHelpers.js'

import { concat, concatRev } from './concat.js'

// Setup

const options = {}

// Tests -- forward

test('should just pass on state when given one pipeline', async () => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = {
    context: [],
    value: ['johnf', 'maryk'],
    flip: false,
  }

  const ret = await concat('users[]')(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should merge arrays from several pipelines', async () => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expectedValue = ['johnf', 'maryk', 'theboss']

  const ret = await concat('users[]', 'admins[]')(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should merge strings from several pipelines into array', async () => {
  const state = {
    context: [],
    value: { group: 'bergen', user: 'johnf' },
  }
  const expectedValue = ['bergen', '-', 'johnf']

  const ret = await concat('group', transform(value('-')), 'user')(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should return empty array when no pipelines', async () => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = {
    context: [],
    value: [],
  }

  const ret = await concat()(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should strip away undefined', async () => {
  const state = {
    context: [],
    value: { group: 'bergen', user: 'johnf', team: null },
  }
  const expectedValue = ['bergen', 'johnf', null]

  const ret = await concat('group', 'unknown', 'user', 'team')(options)(
    noopNext,
  )(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should honor flip', async () => {
  const state = {
    context: [],
    value: ['johnf', 'maryk'],
    rev: false,
    flip: true,
  }
  const expected = {
    context: [],
    value: { users: ['johnf', 'maryk'] },
    rev: false,
    flip: true,
  }

  const ret = await concat('users[]')(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

// Tests -- reverse

test('should set array on one prop in reverse', async () => {
  const state = {
    context: [],
    value: ['johnf', 'maryk'],
    rev: true,
  }
  const expected = {
    context: [],
    value: { users: ['johnf', 'maryk'] },
    rev: true,
    flip: false,
  }

  const ret = await concat('users[]')(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set array on first prop in reverse', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should return an empty object when no pipelines in reverse', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should honor flip in reverse', async () => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    rev: true,
    flip: true,
  }
  const expectedValue = ['johnf', 'maryk', 'theboss']

  const ret = await concat('users[]', 'admins[]')(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

// Tests -- concatRev

test('concatRev should set array on first prop', async () => {
  const state = {
    context: [],
    value: ['johnf', 'maryk', 'theboss'],
  }
  const expectedValue = {
    users: ['johnf', 'maryk', 'theboss'],
    admins: [],
  }

  const ret = await concatRev('users[]', 'admins[]')(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('concatRev should merge arrays from several pipelines in reverse', async () => {
  const state = {
    context: [],
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    rev: true,
  }
  const expectedValue = ['johnf', 'maryk', 'theboss']

  const ret = await concatRev('users[]', 'admins[]')(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})
