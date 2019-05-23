import test from 'ava'

import filter, { FilterFunction } from './filter'

// Helpers

const beginsWithA: FilterFunction = (str) => (typeof str === 'string') ? str.startsWith('A') : false

// Tests

test('should set value to undefined when filter returns false', (t) => {
  const state = {
    root: { title: 'Other entry' },
    context: { title: 'Other entry' },
    value: 'Other entry'
  }
  const expected = {
    root: { title: 'Other entry' },
    context: { title: 'Other entry' },
    value: undefined
  }

  const ret = filter(beginsWithA)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter returns true', (t) => {
  const state = {
    root: { title: 'An entry' },
    context: { title: 'An entry' },
    value: 'An entry'
  }

  const ret = filter(beginsWithA)(state)

  t.deepEqual(ret, state)
})

test('should remove values in array when filter returns false', (t) => {
  const state = {
    root: { users: ['John F', 'Andy'] },
    context: { users: ['John F', 'Andy'] },
    value: ['John F', 'Andy']
  }
  const expected = {
    root: { users: ['John F', 'Andy'] },
    context: { users: ['John F', 'Andy'] },
    value: ['Andy']
  }

  const ret = filter(beginsWithA)(state)

  t.deepEqual(ret, expected)
})

test('should not touch value when filter is not a function', (t) => {
  const state = {
    root: { title: 'An entry' },
    context: { title: 'An entry' },
    value: 'An entry'
  }

  const ret = filter('notallowed' as any)(state)

  t.deepEqual(ret, state)
})
