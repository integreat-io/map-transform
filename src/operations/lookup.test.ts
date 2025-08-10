import test from 'node:test'
import assert from 'node:assert/strict'
import { noopNext } from '../utils/stateHelpers.js'

import { lookup, lookdown } from './lookup.js'

// Setup

const props = { arrayPath: '^^related.users[]', propPath: 'id' }
const options = {}

// Tests -- forward

test('should lookup data', async () => {
  const data = {
    content: { author: 'user2' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
      ],
    },
  }
  const state = {
    context: [data],
    value: 'user2',
  }
  const expected = {
    context: [data],
    value: { id: 'user2', name: 'User 2' },
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should lookup array of data', async () => {
  const data = {
    content: { authors: ['user1', 'user3'] },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const state = {
    context: [data, data.content],
    value: data.content.authors,
  }
  const expected = {
    context: [data, data.content],
    value: [
      { id: 'user1', name: 'User 1' },
      { id: 'user3', name: 'User 3' },
    ],
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should match only first of several matches', async () => {
  const data = {
    content: { authors: ['user1', 'user3'] },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
        { id: 'user3', name: 'Another 3' },
        { id: 'user1', name: 'User 1 also' },
      ],
    },
  }
  const state = {
    context: [data],
    value: ['user1', 'user3'],
  }
  const expectedValue = [
    { id: 'user1', name: 'User 1' },
    { id: 'user3', name: 'User 3' },
  ]

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should match several matches when `matchSeveral` is true', async () => {
  const propsMatchSeveral = { ...props, matchSeveral: true }
  const data = {
    content: { authors: ['user1', 'user3'] },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
        { id: 'user3', name: 'Another 3' },
        { id: 'user1', name: 'User 1 also' },
      ],
    },
  }
  const state = {
    context: [data],
    value: ['user1', 'user3'],
  }
  const expectedValue = [
    { id: 'user1', name: 'User 1' },
    { id: 'user1', name: 'User 1 also' },
    { id: 'user3', name: 'User 3' },
    { id: 'user3', name: 'Another 3' },
  ]

  const ret = await lookup(propsMatchSeveral)(options)(noopNext)(state)

  assert.deepEqual(ret.value, expectedValue)
})

test('should force the value at array path to an array', async () => {
  const props = { arrayPath: '^^related.users', propPath: 'id' } // No array brackets in path
  const data = {
    content: { author: 'user2' },
    related: {
      users: { id: 'user2', name: 'User 2' },
    },
  }
  const state = {
    context: [data],
    value: 'user2',
  }
  const expected = {
    context: [data],
    value: { id: 'user2', name: 'User 2' },
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set value to undefined when array path yields undefined', async () => {
  const data = {
    content: { author: 'user2' },
  }
  const state = {
    context: [data],
    value: 'user2',
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.equal(ret.value, undefined)
})

test('should set value to undefined when no match', async () => {
  const data = {
    content: { author: 'user3' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
      ],
    },
  }
  const state = {
    context: [data],
    value: 'user3',
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.equal(ret.value, undefined)
})

test('should get lookup prop when flipped', async () => {
  const data = { id: 'user2', name: 'User 2' }
  const state = {
    context: [],
    value: data,
    rev: false,
    flip: true,
  }
  const expected = {
    context: [],
    value: 'user2',
    rev: false,
    flip: true,
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should throw when prop path is a pipeline', async () => {
  const props = {
    arrayPath: '^^related.users[]',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propPath: ['id', { $transform: 'string' }] as any,
  }
  const data = {
    content: { author: 'user2' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
      ],
    },
  }
  const state = {
    context: [data],
    value: 'user2',
  }
  const expectedError = new TypeError(
    "The 'lookup' operation does not allow `path` (the prop path) to be a pipeline",
  )

  assert.throws(() => lookup(props)(options)(noopNext)(state), expectedError)
})

// Tests -- reverse

test('should get lookup prop in reverse', async () => {
  const data = { id: 'user2', name: 'User 2' }
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expected = {
    context: [],
    value: 'user2',
    rev: true,
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should get lookup prop on array in reverse', async () => {
  const data = [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
  ]
  const state = {
    context: [],
    value: data,
    rev: true,
  }
  const expected = {
    context: [],
    value: ['user1', 'user2'],
    rev: true,
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should lookup data in reverse when flipped', async () => {
  const data = {
    content: { author: 'user2' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
      ],
    },
  }
  const state = {
    context: [data],
    value: 'user2',
    rev: true,
    flip: true,
  }
  const expected = {
    context: [data],
    value: { id: 'user2', name: 'User 2' },
    rev: true,
    flip: true,
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

// Tests -- lookdown

test('lookdown should get lookup prop going forward', async () => {
  const data = { id: 'user2', name: 'User 2' }
  const state = {
    context: [],
    value: data,
  }
  const expected = {
    context: [],
    value: 'user2',
  }

  const ret = await lookdown(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('lookdown should lookup data in reverse', async () => {
  const data = {
    content: { author: 'user2' },
    related: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
      ],
    },
  }
  const state = {
    context: [data],
    value: 'user2',
    rev: true,
  }
  const expected = {
    context: [data],
    value: { id: 'user2', name: 'User 2' },
    rev: true,
  }

  const ret = await lookdown(props)(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})
