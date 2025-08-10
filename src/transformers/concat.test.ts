import test from 'node:test'
import assert from 'node:assert/strict'

import { concat, concatAsync, concatRev, concatRevAsync } from './concat.js'

// Setup

const options = {}
const state = { rev: false, noDefaults: false, context: [], value: {} }
const stateRev = { ...state, rev: true }

// Tests -- forward

test('should merge arrays from several pipelines', () => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concat({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should merge arrays from one pipeline', () => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = 'users[]'
  const expected = ['johnf', 'maryk']

  const ret = concat({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should merge strings from several pipelines into one array', () => {
  const value = { group: 'bergen', user: 'johnf' }
  const path = ['group', { $value: '-' }, 'user']
  const expected = ['bergen', '-', 'johnf']

  const ret = concat({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should not include undefined', () => {
  const value = { group: 'bergen', user: 'johnf', team: null }
  const path = ['group', 'unknown', 'user', 'team']
  const expected = ['bergen', 'johnf', null]

  const ret = concat({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should not include non-values', () => {
  const value = { group: 'bergen', user: 'johnf', team: null }
  const path = ['group', 'unknown', 'user', 'team']
  const stateWithNonvalues = { ...state, nonvalues: [undefined, null] }
  const expected = ['bergen', 'johnf']

  const ret = concat({ path })(options)(value, stateWithNonvalues)

  assert.deepEqual(ret, expected)
})

test('should return empty array when no pipeline', () => {
  const value = { group: 'bergen', user: 'johnf' }
  const expected: unknown[] = []

  const ret = concat({})(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should behave as forward when flipped in reverse', () => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const stateRevWithFlip = { ...stateRev, flip: true }
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concat({ path })(options)(value, stateRevWithFlip)

  assert.deepEqual(ret, expected)
})

test('should set array on first pipeline going forward with rev version', () => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concatRev({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should merge arrays with async pipelines', async () => {
  const getArr = () => () => async () => ['from async']
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', { $transform: 'getArr' }, 'admins[]']
  const options = { transformers: { getArr } }
  const expected = ['johnf', 'maryk', 'from async', 'theboss']

  const ret = await concatAsync({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

test('should set array in reverse with async pipelines going forward with rev version', async () => {
  const reverse = () => () => async (value: unknown) =>
    Array.isArray(value) ? value.reverse() : value
  const value = ['johnf', 'maryk', 'theboss']
  const path = [['users[]', { $transform: 'reverse' }], 'admins[]']
  const options = { transformers: { reverse } }
  const expected = {
    users: ['theboss', 'maryk', 'johnf'],
    admins: [],
  }

  const ret = await concatRevAsync({ path })(options)(value, state)

  assert.deepEqual(ret, expected)
})

// Tests -- reverse

test('should set array on first pipeline in reverse', () => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concat({ path })(options)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should return empty object when no pipeline in reverse', () => {
  const value = { group: 'bergen', user: 'johnf' }
  const expected = {}

  const ret = concat({})(options)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should behave as reverse when flipped going forward', () => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const stateWithFlip = { ...state, flip: true }
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concat({ path })(options)(value, stateWithFlip)

  assert.deepEqual(ret, expected)
})

test('should merge arrays from several pipelines in reverse with rev version', () => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concatRev({ path })(options)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should set array in reverse with async pipelines', async () => {
  const reverse = () => () => async (value: unknown) =>
    Array.isArray(value) ? value.reverse() : value
  const value = ['johnf', 'maryk', 'theboss']
  const path = [['users[]', { $transform: 'reverse' }], 'admins[]']
  const options = { transformers: { reverse } }
  const expected = {
    users: ['theboss', 'maryk', 'johnf'],
    admins: [],
  }

  const ret = await concatAsync({ path })(options)(value, stateRev)

  assert.deepEqual(ret, expected)
})

test('should merge arrays with async pipelines in reverse with rev version', async () => {
  const getArr = () => () => async () => ['from async']
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', { $transform: 'getArr' }, 'admins[]']
  const options = { transformers: { getArr } }
  const expected = ['johnf', 'maryk', 'from async', 'theboss']

  const ret = await concatRevAsync({ path })(options)(value, stateRev)

  assert.deepEqual(ret, expected)
})
