import test from 'ava'
import transform from '../operations/transform.js'
import compare from './compare.js'
import { value } from './value.js'

import bucket, { Bucket } from './bucket.js'

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

const options = { nonvalues: [undefined, null, ''], transformers: { value } }

// Tests -- forward

test('should sort array into buckets based on condition', async (t) => {
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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'editor' })),
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

test('should sort array into buckets based on size', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user5', name: 'User 5' },
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const buckets = [{ key: 'first2', size: 2 }, { key: 'theRest' }]
  const expected = {
    first2: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user2', name: 'User 2', role: undefined },
    ],
    theRest: [
      { id: 'user3', name: 'User 3' },
      { id: 'user4', name: 'User 4', role: 'admin' },
      { id: 'user5', name: 'User 5' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should sort array into buckets based on condition and sizes', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: 'editor' },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'editor' },
    { id: 'user5', name: 'User 5' },
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const buckets = [
    {
      key: 'firstEditor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
      size: 1,
    },
    {
      key: 'editors',
      condition: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    firstEditor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
    editors: [
      { id: 'user2', name: 'User 2', role: 'editor' },
      { id: 'user4', name: 'User 4', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    users: [
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should treat single object as array', async (t) => {
  const data = { id: 'user2', name: 'User 2' }
  const buckets = [
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'editor' })),
    },

    {
      condition: transform(compare({ path: 'role', match: 'unknown' })),
    } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
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

test('should merge bucket arrays into one array when going forward and flipped', async (t) => {
  const stateFlipped = { ...state, flip: true }
  const data = {
    // We've moved arround the order of the buckets
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
    ],
    editor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
  }
  const buckets = [
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
  ]

  const ret = await bucket({ buckets })(options)(data, stateFlipped)

  t.deepEqual(ret, expected)
})

test('should sort array into buckets based on groupByPath', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user5', name: 'User 5', role: '' }, // Empty string is a non-value
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const groupByPath = 'role'
  const expected = {
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
  }

  const ret = await bucket({ groupByPath })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should force values from groupByPath to string', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 1 },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3', role: {} },
    { id: 'user4', name: 'User 4', role: 2 },
    { id: 'user5', name: 'User 5', role: '' }, // Empty string is a non-value
    { id: 'user6', name: 'User 6', role: 1 },
  ]
  const groupByPath = 'role'
  const expected = {
    '1': [
      { id: 'user1', name: 'User 1', role: 1 },
      { id: 'user6', name: 'User 6', role: 1 },
    ],
    '[object Object]': [{ id: 'user3', name: 'User 3', role: {} }], // The object is forced string. Probably not what we wanted, but it's the best we can do
    '2': [{ id: 'user4', name: 'User 4', role: 2 }],
  }

  const ret = await bucket({ groupByPath })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should sort array into buckets based on a pipeline', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user5', name: 'User 5', role: '' }, // Empty string is a non-value
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const groupByPath = { $alt: ['role', { $value: 'user' }] }
  const expected = {
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    user: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
      { id: 'user5', name: 'User 5', role: '' },
    ],
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
  }

  const ret = await bucket({ groupByPath })(options)(data, state)

  t.deepEqual(ret, expected)
})

test('should return an empty object when no buckets or groupByPath are defined', async (t) => {
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
    { id: 'user4', name: 'User 4', role: 'admin' },
    { id: 'user5', name: 'User 5' },
    { id: 'user6', name: 'User 6', role: 'editor' },
  ]
  const buckets: Bucket[] = []
  const expected = {}

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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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

test('should merge bucket arrays into one array on path', async (t) => {
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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'admin' })),
    },
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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

test('should merge buckets based on groupByPath into on array in reverse', async (t) => {
  const data = {
    editor: [
      { id: 'user1', name: 'User 1', role: 'editor' },
      { id: 'user6', name: 'User 6', role: 'editor' },
    ],
    admin: [{ id: 'user4', name: 'User 4', role: 'admin' }],
  }
  const groupByPath = 'role'
  const expected = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user6', name: 'User 6', role: 'editor' },
    { id: 'user4', name: 'User 4', role: 'admin' },
  ]

  const ret = await bucket({ groupByPath })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return empty array when no buckets', async (t) => {
  const data = {}
  const buckets = [
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
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
      condition: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected: unknown[] = []

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should return empty array when no buckets are defined', async (t) => {
  const data = {
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
  const buckets: Bucket[] = []
  const expected: unknown[] = []

  const ret = await bucket({ buckets })(options)(data, stateRev)

  t.deepEqual(ret, expected)
})

test('should sort array into buckets in rev when flipped', async (t) => {
  const stateRevFlipped = { ...stateRev, flip: true }
  const data = [
    { id: 'user1', name: 'User 1', role: 'editor' },
    { id: 'user2', name: 'User 2', role: undefined },
    { id: 'user3', name: 'User 3' },
  ]
  const buckets = [
    {
      key: 'editor',
      condition: transform(compare({ path: 'role', match: 'editor' })),
    },
    {
      key: 'users',
    },
  ]
  const expected = {
    editor: [{ id: 'user1', name: 'User 1', role: 'editor' }],
    users: [
      { id: 'user2', name: 'User 2', role: undefined },
      { id: 'user3', name: 'User 3' },
    ],
  }

  const ret = await bucket({ buckets })(options)(data, stateRevFlipped)

  t.deepEqual(ret, expected)
})

test('should support pipeline as an alias of condition (but will be removed in next major version)', async (t) => {
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
