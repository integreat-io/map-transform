import test from 'ava'

import { lookup, lookupAsync, lookdown, lookdownAsync } from './lookup.js'

// Setup

const castString = () => () => (value: unknown) => String(value)
const passThrough = () => () => async (value: unknown) => value

const options = { transformers: { castString, passThrough } }

// Tests -- forward

test('should lookup and return first match', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
          { id: 'user2', name: 'Also user 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = { id: 'user2', name: 'User 2' }

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should lookup and return all matches when matchSeveral is true', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
          { id: 'user2', name: 'Also user 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const matchSeveral = true
  const expected = [
    { id: 'user2', name: 'User 2' },
    { id: 'user2', name: 'Also user 2' },
  ]

  const ret = lookup({ arrayPath, propPath, matchSeveral })(options)(
    value,
    state,
  )

  t.deepEqual(ret, expected)
})

test('should force value at arrayPath to array', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: { id: 'user2', name: 'User 2' },
      },
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users'
  const propPath = 'id'
  const expected = { id: 'user2', name: 'User 2' }

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should return undefined when no match', (t) => {
  const context = [
    {
      content: { author: 'user3' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user3'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = undefined

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.is(ret, expected)
})

test('should return undefined when arrayPath returns no data', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {},
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users'
  const propPath = 'id'
  const expected = undefined

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.is(ret, expected)
})

test('should lookup with array of props', (t) => {
  const context = [
    {
      content: { authors: ['user3', 'user1'] },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
          { id: 'user3', name: 'User 3' },
        ],
      },
    },
    { authors: ['user3', 'user1'] },
  ]
  const value = ['user3', 'user1']
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = [
    { id: 'user3', name: 'User 3' }, // Should be in the same order as the values
    { id: 'user1', name: 'User 1' },
  ]

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should pick first when there are several matches', (t) => {
  const context = [
    {
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
    },
  ]
  const value = ['user1', 'user3']
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = [
    { id: 'user1', name: 'User 1' },
    { id: 'user3', name: 'User 3' },
  ]

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should include all matches when matchSeveral is true', (t) => {
  const context = [
    {
      content: { authors: ['user1', 'user0', 'user3'] },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
          { id: 'user3', name: 'User 3' },
          { id: 'user3', name: 'Another 3' },
          { id: 'user1', name: 'User 1 also' },
        ],
      },
    },
  ]
  const value = ['user1', 'user0', 'user3'] // There's no matches for 'user0', but it will not result in `undefined` as we're potentially getting more for each
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const matchSeveral = true
  const propPath = 'id'
  const expected = [
    { id: 'user1', name: 'User 1' },
    { id: 'user1', name: 'User 1 also' }, // Should be in the same order as the values
    { id: 'user3', name: 'User 3' },
    { id: 'user3', name: 'Another 3' },
  ]

  const ret = lookup({ arrayPath, propPath, matchSeveral })(options)(
    value,
    state,
  )

  t.deepEqual(ret, expected)
})

test('should return undefined for values that does not match', (t) => {
  const context = [
    {
      content: { authors: ['user0', 'user2'] },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
          { id: 'user3', name: 'User 3' },
        ],
      },
    },
    { authors: ['user0', 'user2'] },
  ]
  const value = ['user0', 'user2'] // There's no match for 'user0', so it will leave `undefined` in the array to keep the same order and positions as the values
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = [undefined, { id: 'user2', name: 'User 2' }]

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should return empty array when arrayPath does not exist -- with array of props', (t) => {
  const context = [
    {
      content: { authors: ['user1', 'user3'] },
      related: {},
    },
    { authors: ['user1', 'user3'] },
  ]
  const value = ['user1', 'user3']
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = [undefined, undefined]

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should support pipeline in propPath', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = ['id', { $transform: 'castString' }]
  const expected = { id: 'user2', name: 'User 2' }

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should get lookup prop going forward when flipped', (t) => {
  const value = { id: 'user2', name: 'User 2' }
  const state = { rev: false, value, context: [], flip: true }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = 'user2'

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should support async pipelines', async (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: false, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = [{ $transform: 'passThrough' }, 'id']
  const expected = { id: 'user2', name: 'User 2' }

  const ret = await lookupAsync({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should get lookup prop going forward with lookdown', (t) => {
  const value = { id: 'user2', name: 'User 2' }
  const state = { rev: false, value, context: [] }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = 'user2'

  const ret = lookdown({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

// Tests -- reverse

test('should get lookup prop in reverse', (t) => {
  const value = { id: 'user2', name: 'User 2' }
  const state = { rev: true, value, context: [] }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = 'user2'

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should get lookup props from array in reverse', (t) => {
  const value = [
    { id: 'user1', name: 'User 1' },
    { id: 'user2', name: 'User 2' },
  ]
  const state = { rev: true, value, context: [] }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = ['user1', 'user2']

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should lookup in reverse when flipped', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: true, value, context, flip: true }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = { id: 'user2', name: 'User 2' }

  const ret = lookup({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should lookup data in reverse with lookdown', (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: true, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = 'id'
  const expected = { id: 'user2', name: 'User 2' }

  const ret = lookdown({ arrayPath, propPath })(options)(value, state)

  t.deepEqual(ret, expected)
})

test('should support async pipelines in reverse with lookdown', async (t) => {
  const context = [
    {
      content: { author: 'user2' },
      related: {
        users: [
          { id: 'user1', name: 'User 1' },
          { id: 'user2', name: 'User 2' },
        ],
      },
    },
  ]
  const value = 'user2'
  const state = { rev: true, value, context }
  const arrayPath = '^^related.users[]'
  const propPath = [{ $transform: 'passThrough' }, 'id']
  const expected = { id: 'user2', name: 'User 2' }

  const ret = await lookdownAsync({ arrayPath, propPath })(options)(
    value,
    state,
  )

  t.deepEqual(ret, expected)
})
