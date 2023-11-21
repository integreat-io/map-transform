import ava, { TestFn } from 'ava'
import { noopNext } from '../utils/stateHelpers.js'

import { lookup, lookdown } from './lookup.js'

// Setup

interface AvaContext {
  start: number
}

const test = ava as TestFn<AvaContext>

const props = { arrayPath: '^^related.users[]', propPath: 'id' }
const options = {}

test.before((t) => {
  const start = Date.now()
  t.context.start = start
})

test.after((t) => {
  const end = Date.now()
  const start = t.context.start
  const duration = end - start
  console.log(`### lookup.test.ts took ${duration} ms`) // 4-5 ms
})

// Tests -- forward

test('should lookup data', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should lookup array of data', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should match only first of several matches', async (t) => {
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

  t.deepEqual(ret.value, expectedValue)
})

test('should match several matches when `matchSeveral` is true', async (t) => {
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

  t.deepEqual(ret.value, expectedValue)
})

test('should force the value at array path to an array', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should set value to undefined when array path yields undefined', async (t) => {
  const data = {
    content: { author: 'user2' },
  }
  const state = {
    context: [data],
    value: 'user2',
  }

  const ret = await lookup(props)(options)(noopNext)(state)

  t.is(ret.value, undefined)
})

test('should set value to undefined when no match', async (t) => {
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

  t.is(ret.value, undefined)
})

test('should get lookup prop when flipped', async (t) => {
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

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should get lookup prop in reverse', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should get lookup prop on array in reverse', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('should lookup data in reverse when flipped', async (t) => {
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

  t.deepEqual(ret, expected)
})

// Tests -- lookdown

test('lookdown should get lookup prop going forward', async (t) => {
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

  t.deepEqual(ret, expected)
})

test('lookdown should lookup data in reverse', async (t) => {
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

  t.deepEqual(ret, expected)
})
