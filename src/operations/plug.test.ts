import test from 'ava'

import plug from './plug'

// Setup

const options = {}

// Tests

test('should set value to undefined', (t) => {
  const state = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: { data: { name: 'John F.' } }
  }
  const expected = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: undefined
  }

  const ret = plug()(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when onlyMapped', (t) => {
  const state = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: { data: { name: 'John F.' } },
    onlyMapped: true
  }
  const expected = {
    root: { data: { name: 'John F.' } },
    context: { data: { name: 'John F.' } },
    value: undefined,
    onlyMapped: true
  }

  const ret = plug()(options)(state)

  t.deepEqual(ret, expected)
})
