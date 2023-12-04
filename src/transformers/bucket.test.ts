import test from 'ava'
import transform from '../operations/transform.js'
import compare from './compare.js'

import bucket from './bucket.js'

// Setup

const state = {
  rev: false,
  noDefaults: false,
  context: [],
  value: {},
}
const stateRev = {
  rev: true,
  noDefaults: false,
  context: [],
  value: {},
}

const options = {}

// Tests -- forward

test('should sort array into buckets', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user5', name: 'User 5' },
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should not set empty bucket', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user5', name: 'User 5' },
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should get array from path', async (t) => {
  const data = {
    content: {
      users: [
        { id: 'user1', name: 'User 1', role: 'editor' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const path = 'content.users[]'
  const buckets = [
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    editor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
    users: [
      { id: 'user2', name: 'User 2' },
      { id: 'user3', name: 'User 3' },
    ],
  }

  const ret = await bucket({ path, buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should treat single object as array', async (t) => {
  const data = { id: 'user2', name: 'User 2' }
  const buckets = [
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    users: [{ id: 'user2', name: 'User 2' }],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should skip buckets without key', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: 'unknown' },
    { id: 'user3', name: 'User 3' },
  ]
  const buckets = [
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { pipeline: transform(compare({ path: 'role', match: 'unknown' })) } as any,
    {
      key: 'users',
    },
  ]
  const expected = {
    editor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
    users: [
      { id: 'user2', name: 'User 2', role: 'unknown' },
      { id: 'user3', name: 'User 3' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

// Tests -- rev

test('should merge bucket arrays into one array in the order of the defined buckets', async (t) => {
  const data = {
    // We've moved arround the order of the buckets
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5' },
    ],
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
  }
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = [
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user6', name: 'User 6', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user5', name: 'User 5' },
  ]

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should skip buckets that are not defined', async (t) => {
  const data = {
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
    editor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
    unknown: [{ id: 'user0', name: 'User 0' }],
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
    ],
  }
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = [
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
  ]

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test.failing('should merge bucket arrays into one array on path', async (t) => {
  const data = {
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5' },
    ],
  }
  const path = 'content.users[]'
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    content: {
      users: [
        { id: 'user4', name: 'User 4', role: 'admin' },
        { id: 'user1', name: 'User 1', role: 'editor' },
        { id: 'user6', name: 'User 6', role: 'editor' },
        { id: 'user2', name: 'User 2', role: undefined },
        { id: 'user3', name: 'User 3' },
        { id: 'user5', name: 'User 5' },
      ],
    },
  }

  const ret = await bucket({ path, buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should merge bucket values into one array even with non-arrays', async (t) => {
  const data = {
    admin: { id: 'user4', name: 'User 4', role: 'admin' },
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    users: [{ id: 'user2', name: 'User 2', role: undefined }],
  }
  const buckets = [
    {
      key: 'admin',
      pipeline: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = [
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user6', name: 'User 6', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
  ]

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return empty array when no buckets', async (t) => {
  const data = {}
  const buckets = [
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected: unknown[] = []

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return empty array when we have no buckets object', async (t) => {
  const data = undefined
  const buckets = [
    {
      key: 'editor',
      pipeline: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected: unknown[] = []

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})
