import test from 'ava'

import { concat, concatAsync, concatRev, concatRevAsync } from './concat.js'

// Setup

const options = {}
const state = { rev: false, noDefaults: false, context: [], value: {} }
const stateRev = { ...state, rev: true }

// Tests -- forward

test('should merge arrays from several pipelines', (t) => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concat({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should merge arrays from one pipeline', (t) => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = 'users[]'
  const expected = ['johnf', 'maryk']

  const ret = concat({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should merge strings from several pipelines into one array', (t) => {
  const value = { group: 'bergen', user: 'johnf' }
  const path = ['group', { $value: '-' }, 'user']
  const expected = ['bergen', '-', 'johnf']

  const ret = concat({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should not include undefined', (t) => {
  const value = { group: 'bergen', user: 'johnf', team: null }
  const path = ['group', 'unknown', 'user', 'team']
  const expected = ['bergen', 'johnf', null]

  const ret = concat({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should not include non-values', (t) => {
  const value = { group: 'bergen', user: 'johnf', team: null }
  const path = ['group', 'unknown', 'user', 'team']
  const stateWithNonvalues = { ...state, nonvalues: [undefined, null] }
  const expected = ['bergen', 'johnf']

  const ret = concat({ path })(options)(value, stateWithNonvalues)

  t.deepEqual(ret, expected)
})

test('should return empty array when no pipeline', (t) => {
  const value = { group: 'bergen', user: 'johnf' }
  const expected: unknown[] = []

  const ret = concat({})(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should behave as forward when flipped in reverse', (t) => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const stateRevWithFlip = { ...stateRev, flip: true }
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concat({ path })(options)(value, stateRevWithFlip)

  t.deepEqual(ret, expected)
})

test('should set array on first pipeline going forward with rev version', (t) => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concatRev({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should merge arrays with async pipelines', async (t) => {
  const getArr = () => () => async () => ['from async']
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', { $transform: 'getArr' }, 'admins[]']
  const options = { transformers: { getArr } }
  const expected = ['johnf', 'maryk', 'from async', 'theboss']

  const ret = await concatAsync({ path })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should set array in reverse with async pipelines going forward with rev version', async (t) => {
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

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should set array on first pipeline in reverse', (t) => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concat({ path })(options)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should return empty object when no pipeline in reverse', (t) => {
  const value = { group: 'bergen', user: 'johnf' }
  const expected = {}

  const ret = concat({})(options)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should behave as reverse when flipped going forward', (t) => {
  const value = ['johnf', 'maryk', 'theboss']
  const path = ['users[]', 'admins[]']
  const stateWithFlip = { ...state, flip: true }
  const expected = { users: ['johnf', 'maryk', 'theboss'], admins: [] }

  const ret = concat({ path })(options)(value, stateWithFlip)

  t.deepEqual(ret, expected)
})

test('should merge arrays from several pipelines in reverse with rev version', (t) => {
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', 'admins[]']
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = concatRev({ path })(options)(value, stateRev)

  t.deepEqual(ret, expected)
})

test('should set array in reverse with async pipelines', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should merge arrays with async pipelines in reverse with rev version', async (t) => {
  const getArr = () => () => async () => ['from async']
  const value = { users: ['johnf', 'maryk'], admins: ['theboss'] }
  const path = ['users[]', { $transform: 'getArr' }, 'admins[]']
  const options = { transformers: { getArr } }
  const expected = ['johnf', 'maryk', 'from async', 'theboss']

  const ret = await concatRevAsync({ path })(options)(value, stateRev)

  t.deepEqual(ret, expected)
})
