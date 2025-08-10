import test from 'node:test'
import assert from 'node:assert/strict'
import type { State } from '../types.js'
import type { PreppedPipeline } from '../run/index.js'

import prep from './index.js'

// Setup

const uppercaseFn = (val: unknown, _state: State) =>
  typeof val === 'string' ? val.toUpperCase() : val
const uppercase = () => () => uppercaseFn

const options = {
  transformers: { uppercase },
}

// Tests

test('should prepare mutation object', () => {
  const def = {
    id: 'key',
    title: 'name',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare mutation object with pipelines', () => {
  const def = {
    id: ['key'],
    title: ['name', { $transform: 'uppercase' }],
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', { type: 'transform', fn: uppercaseFn }, '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should forward plug slashed properties', () => {
  const def = {
    id: 'key',
    title: 'name',
    'title/1': 'desc',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['|', 'desc', '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should forward plug slashed property without a path', () => {
  const def = {
    id: 'key',
    title: 'name',
    '/1': 'desc',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['|', 'desc'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should unescape escaped slash', () => {
  const def = {
    id: 'key',
    title: 'name',
    'title\\/1': 'desc',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['desc', '>title/1'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should unescape a slashed property', () => {
  const def = {
    id: 'key',
    title: 'name',
    'title\\/desc/1': 'desc', // Both an escaped slash and a slashed property
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        ['|', 'desc', '>title/desc'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should plug pipelines with no set in reverse', () => {
  const def = {
    id: 'key',
    title: 'name',
    archived: { $value: true },
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
        [{ type: 'value', value: true, fixed: false }, '>archived', '>|'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should skip props without a pipeline', () => {
  const def = {
    id: 'key',
    title: null,
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>id']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should skip unknown dollar props', () => {
  const def = {
    id: 'key',
    $title: 'name',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>id']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should unescape escaped dollar props', () => {
  const def = {
    id: 'key',
    '\\$title': 'name',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>$title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should return no pipelines when no props', () => {
  const def = {}
  const expected = [{ type: 'mutation', pipelines: [] }]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should prepare mutation object with more levels', () => {
  const def = {
    id: 'key',
    props: {
      title: ['name', { $transform: 'uppercase' }],
      slug: ['^^.key'],
    },
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        [
          '.',
          {
            type: 'mutation',
            pipelines: [
              ['name', { type: 'transform', fn: uppercaseFn }, '>title'],
              ['^^', 'key', '>slug'],
            ],
          },
          '>props',
        ],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support dot notation in props', () => {
  const def = {
    id: 'key',
    'content.title': 'name',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>title', '>content'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support index notation in props', () => {
  const def = {
    id: 'key',
    'names[0]': 'name',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>id'],
        ['name', '>[0]', '>names'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $iterate', () => {
  const def = {
    $iterate: true,
    id: 'key',
    title: 'name',
  }
  const expected = [
    {
      type: 'mutation',
      it: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

// TODO: Do we really need to set this, or is it handled by the presence of the
// array bracket step?
test('should iterate sub-objects on array path', () => {
  const def = {
    'items[]': {
      id: 'key',
      title: ['name', { $transform: 'uppercase' }],
    },
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        [
          '.',
          {
            type: 'mutation',
            it: true,
            pipelines: [
              ['key', '>id'],
              ['name', { type: 'transform', fn: uppercaseFn }, '>title'],
            ],
          },
          '>[]',
          '>items',
        ],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support $modify prop', () => {
  const def = {
    $modify: true,
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>slug'], ['>...']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support $modify prop with dot path', () => {
  const def = {
    $modify: '.',
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>slug'], ['>...']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support reverse $modify prop', () => {
  const def = {
    '.': '$modify',
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>slug'], ['...']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should support $modify prop with a dot notation path', () => {
  const def = {
    $modify: 'data.props',
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [
        ['key', '>slug'],
        ['data', 'props', '>...'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should skip props with $modify in both directions', () => {
  const def = {
    $modify: 'data.$modify',
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>slug']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should not treat prop starting with $modify as modify', () => {
  const def = {
    $modifySomething: 'props',
    slug: 'key',
  }
  const expected = [
    {
      type: 'mutation',
      pipelines: [['key', '>slug']],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should return no step when mutation object has only a $modify prop', () => {
  const def = { $modify: true }
  const expected: PreppedPipeline = []

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $flip', () => {
  const def = {
    $flip: true,
    key: 'id',
    name: ['title', { $transform: 'uppercase' }],
  }
  const expected = [
    {
      type: 'mutation',
      flip: true,
      pipelines: [
        ['id', '>key'],
        ['title', { type: 'transform', fn: uppercaseFn }, '>name'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $noDefaults', () => {
  const def = {
    $noDefaults: true,
    id: 'key',
    title: 'name',
  }
  const expected = [
    {
      type: 'mutation',
      noDefaults: true,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})

test('should pass on $noDefaults when it is false', () => {
  const def = {
    $noDefaults: false,
    id: 'key',
    title: 'name',
  }
  const expected = [
    {
      type: 'mutation',
      noDefaults: false,
      pipelines: [
        ['key', '>id'],
        ['name', '>title'],
      ],
    },
  ]

  const ret = prep(def, options)

  assert.deepEqual(ret, expected)
})
