import test from 'ava'
import value from './value'

import concat from './concat'

// Tests

test('should just pass on state when given one pipeline', (t) => {
  const state = {
    root: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    context: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    arr: false
  }
  const expected = {
    root: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    context: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    value: ['johnf', 'maryk'],
    arr: false
  }

  const ret = concat('users[]')(state)

  t.deepEqual(ret, expected)
})

test('should merge arrays from several pipelines', (t) => {
  const state = {
    root: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    context: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    value: { users: ['johnf', 'maryk'], admins: ['theboss'] },
    arr: false
  }
  const expectedValue = ['johnf', 'maryk', 'theboss']

  const ret = concat('users[]', 'admins[]')(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should merge strings from several pipelines into array', (t) => {
  const state = {
    root: { group: 'bergen', user: 'johnf' },
    context: { group: 'bergen', user: 'johnf' },
    value: { group: 'bergen', user: 'johnf' },
    arr: false
  }
  const expectedValue = ['bergen', '-', 'johnf']

  const ret = concat('group', value('-'), 'user')(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should strip away undefined', (t) => {
  const state = {
    root: { group: 'bergen', user: 'johnf', team: null },
    context: { group: 'bergen', user: 'johnf', team: null },
    value: { group: 'bergen', user: 'johnf', team: null },
    arr: false
  }
  const expectedValue = ['bergen', 'johnf', null]

  const ret = concat('group', 'unknown', 'user', 'team')(state)

  t.deepEqual(ret.value, expectedValue)
})
