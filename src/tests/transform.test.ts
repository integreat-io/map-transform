import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../utils/is.js'
import type { TransformDefinition } from '../prep/index.js'
import type { TransformerProps } from '../typesNext.js'

import mapTransformSync, { mapTransformAsync } from '../mapTransform.js'

// Setup

const createTitle = (item: Record<string, unknown>) =>
  `${item.title} - by ${item.author}`

const appendToTitle =
  ({ text }: TransformerProps) =>
  () =>
  (item: unknown) =>
    isObject(item) ? { ...item, title: `${item.title}${text}` } : item

const appendAuthorToTitle = () => () => (item: unknown) =>
  isObject(item) ? { ...item, title: createTitle(item) } : item

const appendAuthorToTitleAsync = () => () => async (item: unknown) =>
  isObject(item) ? { ...item, title: createTitle(item) } : item

const setActive = () => () => (item: unknown) =>
  isObject(item) ? { ...item, active: true } : item

const prepareAuthorName = ({ author }: Record<string, unknown>) =>
  typeof author === 'string'
    ? `${author[0].toUpperCase()}${author.slice(1)}.`
    : ''

const setAuthorName = () => () => (item: unknown) =>
  isObject(item) ? { ...item, authorName: prepareAuthorName(item) } : item

const appendEllipsis = () => () => (str: unknown) =>
  typeof str === 'string' ? str + ' ...' : str

const getLength = () => () => (str: unknown) =>
  typeof str === 'string' ? str.length : -1

const generateTag = () => () => (value: unknown) =>
  isObject(value) ? `${value.tag}-${value.sequence}` : undefined

const transformers = {
  appendAuthorToTitle,
  appendAuthorToTitleAsync,
  appendEllipsis,
  appendToTitle,
  generateTag,
  getLength,
  setActive,
  setAuthorName,
  [Symbol.for('getLength')]: getLength,
}

const options = { transformers }

// Tests

test('should map simple object with one transform function', () => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    { $transform: 'appendAuthorToTitle' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf',
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should map simple object with several transforms', () => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    { $transform: 'appendAuthorToTitle' },
    { $transform: 'setActive' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf',
    active: true,
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should throw when an async transform is used in a sync pipeline', () => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    { $transform: 'appendAuthorToTitleAsync' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expectedError = new Error(
    'A transformer returned a promise in a synchronous pipeline. Use mapTransformAsync() to run async transformers',
  )

  assert.throws(() => mapTransformSync(def, options)(data), expectedError)
})

test('should map with async transforms', async () => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    { $transform: 'appendAuthorToTitleAsync' },
    { $transform: 'setActive' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf',
    active: true,
  }

  const ret = await mapTransformAsync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should reverse map simple object with rev transform', () => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
      authorName: 'meta.writer.name',
    },
    { $transform: 'setAuthorName', $direction: 'rev' },
  ]
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf', name: 'Johnf.' } },
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should transform before data is set on outer path', () => {
  const def = {
    attributes: [
      'result.data',
      {
        title: 'content.heading',
        author: 'meta.writer.username',
      },
      { $transform: 'appendAuthorToTitle' },
    ],
  }
  const data = {
    result: {
      data: {
        content: { heading: 'The heading' },
        meta: { writer: { username: 'johnf' } },
      },
    },
  }
  const expected = {
    attributes: {
      title: 'The heading - by johnf',
      author: 'johnf',
    },
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should transform before mapping', () => {
  const def = [
    { $transform: 'setActive' },
    {
      title: 'content.heading',
      enabled: 'active',
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    title: 'The heading',
    enabled: true,
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply transforms from left to right', () => {
  const def = [
    {
      titleLength: [
        'content.heading',
        { $transform: 'appendEllipsis' },
        { $transform: 'getLength' },
      ],
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    titleLength: 15,
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should interate transform from an operation object', () => {
  const def = [
    {
      titleLengths: [
        'content[].heading',
        { $transform: 'getLength', $iterate: true },
      ],
    },
  ]
  const data = {
    content: [{ heading: 'The heading' }, { heading: 'The next heading' }],
  }
  const expected = {
    titleLengths: [11, 16],
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply transform from an operation object with arguments', () => {
  const def = [
    {
      title: 'content.heading',
    },
    { $transform: 'appendToTitle', text: ' - archived' },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    title: 'The heading - archived',
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use built in fixed function', () => {
  const def = {
    title: ['content', { $transform: 'fixed', value: "I'm always here" }],
  }
  const data = { content: { heading: 'The heading' } }
  const expected = { title: "I'm always here" }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use built in fixed function with value function', () => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: () => "I'm from the function!" },
    ],
  }
  const data = { content: { heading: 'The heading' } }
  const expected = { title: "I'm from the function!" }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use built in fixed function in reverse', () => {
  const def = {
    title: ['content', { $transform: 'fixed', value: "I'm always here" }],
  }
  const data = { title: 'The heading' }
  const expected = { content: "I'm always here" }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use built in map function', () => {
  const def = {
    result: [
      'status',
      {
        $transform: 'map',
        dictionary: [
          [200, 'ok'],
          [404, 'notfound'],
          ['*', 'error'],
        ],
      },
    ],
  }
  const data = { status: 404 }
  const expected = { result: 'notfound' }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use built in map function with named dictionary', () => {
  const def = {
    result: [
      'status',
      {
        $transform: 'map',
        dictionary: 'statusCodes',
      },
    ],
  }
  const dictionaries = {
    statusCodes: [
      [200, 'ok'] as const,
      [404, 'notfound'] as const,
      ['*', 'error'] as const,
    ],
  }
  const data = { status: 404 }
  const expected = { result: 'notfound' }

  const ret = mapTransformSync(def, { ...options, dictionaries })(data)

  assert.deepEqual(ret, expected)
})

test('should use built in explode function', () => {
  const def = {
    rate: [
      'currencies',
      { $transform: 'explode' },
      { $filter: 'compare', path: 'key', match: 'EUR' },
      '[0].value',
    ],
  }
  const data = {
    currencies: { NOK: 1, USD: 0.125, EUR: 0.1 },
  }
  const expected = { rate: 0.1 }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use built in implode function', () => {
  const def = { properties: { $transform: 'implode' } }
  const data = [
    { key: 'value', value: 32 },
    { key: 'unit', value: 'KG' },
  ]
  const expected = { properties: { value: 32, unit: 'KG' } }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should only use transform going forward', () => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: "I'm always here", $direction: 'fwd' },
    ],
  }
  const data = { content: { heading: 'The heading' } }
  const expectedFwd = { title: "I'm always here" }
  const expectedRev = { content: undefined }

  const retFwd = mapTransformSync(def, options)(data)
  const retRev = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should only use transform going in reverse', () => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: "I'm always here", $direction: 'rev' },
    ],
  }
  const data = { title: 'The heading' }
  const expectedFwd = { title: undefined }
  const expectedRev = { content: "I'm always here" }

  const retFwd = mapTransformSync(def, options)(data)
  const retRev = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should only use transform going in reverse when flipped', () => {
  const def = {
    $flip: true,
    content: [
      'title',
      { $transform: 'fixed', value: "I'm always here", $direction: 'rev' },
    ],
  }
  const data = { title: 'The heading' }
  const expectedFwd = { title: undefined }
  const expectedRev = { content: "I'm always here" }

  const retFwd = mapTransformSync(def, options)(data)
  const retRev = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(retFwd, expectedFwd)
  assert.deepEqual(retRev, expectedRev)
})

test('should provide index when iterating', () => {
  const def = [
    'content',
    {
      $iterate: true,
      title: 'heading',
      sequence: { $transform: 'index' },
    },
  ]
  const data = {
    content: [{ heading: 'The heading' }, { heading: 'The other' }],
  }

  const expected = [
    { title: 'The heading', sequence: 0 },
    { title: 'The other', sequence: 1 },
  ]

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should provide index deep down when iterating', () => {
  const def = [
    'content',
    {
      $iterate: true,
      title: 'heading',
      meta: {
        sectionId: [
          {
            sequence: { $transform: 'index' },
            tag: 'tags[0]',
          },
          { $transform: 'generateTag' },
        ],
      },
    },
  ]
  const data = {
    content: [
      { heading: 'The heading', tags: ['news'] },
      { heading: 'The other', tags: ['sports'] },
    ],
  }

  const expected = [
    { title: 'The heading', meta: { sectionId: 'news-0' } },
    { title: 'The other', meta: { sectionId: 'sports-1' } },
  ]

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should apply transform function to array with iteration', () => {
  const def = [
    'content',
    {
      tags: { $transform: 'generateTag', $iterate: true },
    },
  ]
  const data = {
    content: [
      { tag: 'news', sequence: 1 },
      { tag: 'sports', sequence: 2 },
    ],
  }

  const expected = { tags: ['news-1', 'sports-2'] }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should provide index through apply when iterating', () => {
  const sectionIdDef = [
    {
      sequence: { $transform: 'index' },
      tag: 'tags[0]',
    },
    { $transform: 'generateTag' },
  ]
  const def = [
    'content',
    {
      $iterate: true,
      title: 'heading',
      meta: {
        sectionId: { $apply: 'sectionId' },
      },
    },
  ]
  const data = {
    content: [
      { heading: 'The heading', tags: ['news'] },
      { heading: 'The other', tags: ['sports'] },
    ],
  }

  const expected = [
    { title: 'The heading', meta: { sectionId: 'news-0' } },
    { title: 'The other', meta: { sectionId: 'sports-1' } },
  ]

  const ret = mapTransformSync(def, {
    ...options,
    pipelines: { sectionId: sectionIdDef },
  })(data)

  assert.deepEqual(ret, expected)
})

test('should provide index when iterating in reverse', () => {
  const def = [
    'content',
    {
      $iterate: true,
      title: 'heading',
      sequence: ['index', { $transform: 'index' }],
    },
  ]
  const data = [{ title: 'The heading' }, { title: 'The other' }]

  const expected = {
    content: [
      { heading: 'The heading', index: 0 },
      { heading: 'The other', index: 1 },
    ],
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should support $value shorthand', () => {
  const def = [
    {
      title: ['content.heading', { $value: 'Default title' }],
      views: ['meta.views', { $value: 0 }],
    },
  ]
  const data = {}
  const expected = {
    title: 'Default title',
    views: 0,
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should concat arrays with $concat', () => {
  const def = [
    'org',
    {
      $concat: ['users', 'admins'],
    },
  ]
  const data = {
    org: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should treat one path given to $concat as an array of one', () => {
  const def = [
    'org',
    {
      $concat: 'users',
    },
  ]
  const data = {
    org: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = ['johnf', 'maryk']

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should concat arrays with $concatRev in reverse', () => {
  const def = [
    {
      $concatRev: ['users', 'admins'],
    },
    '>org',
  ]
  const data = {
    org: { users: ['johnf', 'maryk'], admins: ['theboss'] },
  }
  const expected = ['johnf', 'maryk', 'theboss']

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should shallow merge object with $merge', () => {
  const def = {
    $merge: ['original', 'modified'],
  }
  const data = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Title 1',
      text: 'And so this happened',
      tags: ['news', 'politics'],
    },
    modified: {
      id: 'ent1',
      title: 'Better title',
      text: undefined,
      tags: ['sports'],
    },
  }
  const expected = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    text: 'And so this happened',
    tags: ['sports'],
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should shallow merge object with $merge in reverse', () => {
  const def = {
    $merge: ['original', 'modified'],
  }
  const data = {
    id: 'ent1',
    $type: 'entry',
    title: 'Better title',
    text: 'And so this happened',
    tags: ['sports'],
  }
  const expected = {
    original: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      text: 'And so this happened',
      tags: ['sports'],
    },
    modified: {
      id: 'ent1',
      $type: 'entry',
      title: 'Better title',
      text: 'And so this happened',
      tags: ['sports'],
    },
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use built in map function in reverse', () => {
  const def = {
    result: [
      'status',
      {
        $transform: 'map',
        dictionary: [
          [200, 'ok'],
          [404, 'notfound'],
          ['*', 'error'],
        ],
      },
    ],
  }
  const data = { result: 'notfound' }
  const expected = { status: 404 }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use built in explode function in reverse', () => {
  // explode converts an object to an array of { key, value } pairs.
  // In reverse, it should convert an array of { key, value } pairs back to an object.
  const def = {
    items: ['data', { $transform: 'explode' }],
  }
  const data = {
    items: [
      { key: 'NOK', value: 1 },
      { key: 'EUR', value: 0.1 },
    ],
  }
  const expected = {
    data: { NOK: 1, EUR: 0.1 },
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use built in implode function in reverse', () => {
  // implode converts an array of { key, value } pairs to an object.
  // In reverse, it should convert an object back to an array of { key, value } pairs.
  const def = { properties: { $transform: 'implode' } }
  const data = { properties: { value: 32, unit: 'KG' } }
  const expected = [
    { key: 'value', value: 32 },
    { key: 'unit', value: 'KG' },
  ]

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should not affect forward when transform is used as mutation property value', () => {
  // A transform used directly as a mutation property value (no get path)
  // should still work correctly in forward mode after allowing transforms
  // to not be plugged in reverse.
  const def = { properties: { $transform: 'implode' } }
  const data = [
    { key: 'value', value: 32 },
    { key: 'unit', value: 'KG' },
  ]
  const expected = { properties: { value: 32, unit: 'KG' } }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should use forward-only transform as mutation property value in forward', () => {
  // A forward-only transform should still work in forward mode
  const def = {
    title: { $transform: 'fixed', value: "I'm fixed", $direction: 'fwd' },
  }
  const data = { content: 'something' }
  const expected = { title: "I'm fixed" }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should skip forward-only transform as mutation property value in reverse', () => {
  // A forward-only transform used as mutation property value. In reverse,
  // the transform is skipped ($direction: 'fwd'), but the get from 'title'
  // still runs and the value passes through the merge step.
  const def = {
    title: { $transform: 'fixed', value: "I'm fixed", $direction: 'fwd' },
  }
  const data = { title: 'The heading' }
  const expected = 'The heading'

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should run bidirectional transform in reverse', () => {
  // A transform without $direction runs in both directions.
  // appendEllipsis appends ' ...' so in reverse it also appends.
  const def = {
    title: ['content.heading', { $transform: 'appendEllipsis' }],
  }
  const data = { title: 'The heading' }
  const expected = { content: { heading: 'The heading ...' } }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use fixed transform as mutation property value in reverse', () => {
  // `fixed` always returns its value regardless of direction.
  // In reverse, it gets from `title`, but `fixed` ignores input and returns
  // its fixed value, which is then merged with the target.
  const def = {
    title: { $transform: 'fixed', value: 'Always this' },
  }
  const data = { title: 'Original' }
  const expected = 'Always this'

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use explode transform as mutation property value in reverse', () => {
  // `explode` converts an object to [{key, value}, ...] in forward.
  // In reverse, it does the opposite: [{key, value}, ...] → object.
  const def = { items: { $transform: 'explode' } }
  const data = {
    items: [
      { key: 'a', value: 1 },
      { key: 'b', value: 2 },
    ],
  }
  const expected = { a: 1, b: 2 }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use map transform as mutation property value in reverse', () => {
  // `map` does dictionary lookup. In reverse, it does reverse lookup.
  const def = {
    result: {
      $transform: 'map',
      dictionary: [
        ['draft', 'Draft'],
        ['published', 'Published'],
      ],
    },
  }
  const data = { result: 'Published' }
  const expected = 'published'

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use not transform as mutation property value in reverse', () => {
  // `not` negates a boolean. It does the same in both directions.
  const def = {
    disabled: { $transform: 'not' },
  }
  const data = { disabled: true }
  const expected = false

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use flatten transform as mutation property value in reverse', () => {
  // `flatten` flattens nested arrays. Same in both directions.
  const def = {
    items: { $transform: 'flatten' },
  }
  const data = {
    items: [
      [1, 2],
      [3, 4],
    ],
  }
  const expected = [1, 2, 3, 4]

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should use custom non-directional transform as mutation property value in reverse', () => {
  // A custom transform (getLength) that doesn't check direction
  // runs the same in both directions. In reverse, it gets from `len`,
  // applies getLength, and merges.
  const def = {
    len: { $transform: 'getLength' },
  }
  const data = { len: 'hello' }
  const expected = 5

  const ret = mapTransformSync(def, options)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should apply transform from an operation object with Symbol as key', () => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: Symbol.for('getLength') }],
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    titleLength: 11,
  }

  const ret = mapTransformSync(def, options)(data)

  assert.deepEqual(ret, expected)
})

test('should throw when transform is given an unknown transformer id', () => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: 'unknown' }],
    },
  ]
  const expectedError = new Error(
    "Transformer 'unknown' was not found for transform operation",
  )

  assert.throws(() => mapTransformSync(def, options), expectedError)
})

test('should throw when transform is given an unknown transformer id symbol', () => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: Symbol.for('unknown') }],
    },
  ]
  const expectedError = new Error(
    "Transformer 'Symbol(unknown)' was not found for transform operation",
  )

  assert.throws(() => mapTransformSync(def, options), expectedError)
})

test('should throw when transform operation is missing a transformer id', () => {
  const def = [
    'content',
    {
      $iterate: true,
      title: ['heading', { $transform: null }], // No transformer id
    },
  ] as unknown as TransformDefinition
  const expectedError = new Error(
    'Transform operation is missing transformer id',
  )

  assert.throws(() => mapTransformSync(def, options), expectedError)
})

test('should throw when transform operation has invalid transformer id', () => {
  const def = [
    'content',
    {
      $iterate: true,
      title: ['heading', { $transform: { id: 13 } }], // Just something invalid
    },
  ] as unknown as TransformDefinition
  const expectedError = new Error(
    'Transform operation was given a transformer id that is not a string or symbol',
  )

  assert.throws(() => mapTransformSync(def, options), expectedError)
})

test('should run operation objects trought modifyOperationObject', () => {
  const modifyOperationObject = (op: Record<string, unknown>) =>
    op.$append
      ? {
          $transform: 'appendToTitle',
          text: op.$append,
        }
      : op
  const def = [
    {
      title: 'content.heading',
    },
    { $append: ' - archived' },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    title: 'The heading - archived',
  }

  const ret = mapTransformSync(def, { ...options, modifyOperationObject })(data)

  assert.deepEqual(ret, expected)
})
