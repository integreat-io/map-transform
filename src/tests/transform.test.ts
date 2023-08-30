import test from 'ava'
import type { TransformerProps, TransformDefinition } from '../types.js'
import { isObject } from '../utils/is.js'

import mapTransform, { transform, rev } from '../index.js'

// Setup

const createTitle = async (item: Record<string, unknown>) =>
  `${item.title} - by ${item.author}`
const removeAuthor = async (item: Record<string, unknown>) =>
  typeof item.title === 'string' && item.title.endsWith(` - by ${item.author}`)
    ? item.title.slice(
        0,
        item.title.length -
          6 -
          (typeof item.author === 'string' ? item.author.length : 0)
      )
    : item.title

const appendToTitle =
  ({ text }: TransformerProps) =>
  () =>
  async (item: unknown) =>
    isObject(item) ? { ...item, title: `${item.title}${text}` } : item

const appendAuthorToTitle = () => async (item: unknown) =>
  isObject(item) ? { ...item, title: await createTitle(item) } : item

const removeAuthorFromTitle = () => async (item: unknown) =>
  isObject(item) ? { ...item, title: await removeAuthor(item) } : item

const setActive = () => async (item: unknown) =>
  isObject(item) ? { ...item, active: true } : item

const prepareAuthorName = async ({ author }: Record<string, unknown>) =>
  typeof author === 'string'
    ? `${author[0].toUpperCase()}${author.slice(1)}.`
    : ''

const setAuthorName = () => async (item: unknown) =>
  isObject(item) ? { ...item, authorName: await prepareAuthorName(item) } : item

const appendEllipsis = () => async (str: unknown) =>
  typeof str === 'string' ? str + ' ...' : str

const getLength = () => () => async (str: unknown) =>
  typeof str === 'string' ? str.length : -1

const generateTag = () => () => async (value: unknown) =>
  isObject(value) ? `${value.tag}-${value.sequence}` : undefined

const transformers = {
  appendToTitle,
  generateTag,
  getLength,
  [Symbol.for('getLength')]: getLength,
}

// Tests

test('should map simple object with one transform function', async (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    transform(appendAuthorToTitle),
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf',
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map simple object with old synchronous transform function', async (t) => {
  const exclamateTitle = () => (item: unknown) =>
    isObject(item) ? { ...item, title: `${item.title}!` } : item
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    transform(exclamateTitle),
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }
  const expected = {
    title: 'The heading!',
    author: 'johnf',
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map simple object with several transforms', async (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    transform(appendAuthorToTitle),
    transform(setActive),
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should reverse map simple object with rev transform', async (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
      authorName: 'meta.writer.name',
    },
    rev(transform(setAuthorName)),
  ]
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf', name: 'Johnf.' } },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map simple object with dedicated rev transform', async (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
    },
    transform(appendAuthorToTitle, removeAuthorFromTitle),
  ]
  const data = {
    title: 'The heading - by johnf',
    author: 'johnf',
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should transform beofre data is set on outer path', async (t) => {
  const def = {
    attributes: [
      'result.data',
      {
        title: 'content.heading',
        author: 'meta.writer.username',
      },
      transform(appendAuthorToTitle),
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should transform before mapping', async (t) => {
  const def = [
    transform(setActive),
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply transforms from left to right', async (t) => {
  const def = [
    {
      titleLength: [
        'content.heading',
        transform(appendEllipsis),
        transform(getLength()),
      ],
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    titleLength: 15,
  }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply transform from an operation object', async (t) => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: 'getLength' }],
    },
  ]
  const data = {
    content: { heading: 'The heading' },
  }
  const expected = {
    titleLength: 11,
  }

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should interate transform from an operation object', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should apply transform from an operation object with arguments', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should use built in get function', async (t) => {
  const def = {
    title: ['content', { $transform: 'get', path: 'heading' }],
  }
  const data = { content: { heading: 'The heading', meta: { user: 'johnf' } } }
  const expected = { title: 'The heading' }

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should use built in fixed function', async (t) => {
  const def = {
    title: ['content', { $transform: 'fixed', value: "I'm always here" }],
  }
  const data = { content: { heading: 'The heading' } }
  const expected = { title: "I'm always here" }

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should use built in fixed function with value function', async (t) => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: () => "I'm from the function!" },
    ],
  }
  const data = { content: { heading: 'The heading' } }
  const expected = { title: "I'm from the function!" }

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should use built in fixed function in reverse', async (t) => {
  const def = {
    title: ['content', { $transform: 'fixed', value: "I'm always here" }],
  }
  const data = { title: 'The heading' }
  const expected = { content: "I'm always here" }

  const ret = await mapTransform(def, { transformers })(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should use built in map function', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should use built in map function with named dictionary', async (t) => {
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

  const ret = await mapTransform(def, { transformers, dictionaries })(data)

  t.deepEqual(ret, expected)
})

test('should use built in explode function', async (t) => {
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use built in implode function', async (t) => {
  const def = { properties: { $transform: 'implode' } }
  const data = [
    { key: 'value', value: 32 },
    { key: 'unit', value: 'KG' },
  ]
  const expected = { properties: { value: 32, unit: 'KG' } }

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should only use transform going forward', async (t) => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: "I'm always here", $direction: 'fwd' },
    ],
  }
  const data = { content: { heading: 'The heading' } }
  const expectedFwd = { title: "I'm always here" }
  const expectedRev = { content: undefined }

  const retFwd = await mapTransform(def, { transformers })(data)
  const retRev = await mapTransform(def, { transformers })(data, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should only use transform going in reverse', async (t) => {
  const def = {
    title: [
      'content',
      { $transform: 'fixed', value: "I'm always here", $direction: 'rev' },
    ],
  }
  const data = { title: 'The heading' }
  const expectedFwd = { title: undefined }
  const expectedRev = { content: "I'm always here" }

  const retFwd = await mapTransform(def, { transformers })(data)
  const retRev = await mapTransform(def, { transformers })(data, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should only use transform going in reverse when flipped', async (t) => {
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

  const retFwd = await mapTransform(def, { transformers })(data)
  const retRev = await mapTransform(def, { transformers })(data, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should provide index when iterating', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should provide index deep down when iterating', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should apply transform function to array with iteration', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should provide index through apply when iterating', async (t) => {
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

  const ret = await mapTransform(def, {
    transformers,
    pipelines: { sectionId: sectionIdDef },
  })(data)

  t.deepEqual(ret, expected)
})

test('should provide index when iterating in reverse', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support $value shorthand', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should concat arrays with $concat', async (t) => {
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should treat one path given to $concat as an array of one', async (t) => {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = await mapTransform(def as any)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge object with $merge', async (t) => {
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

  const ret = await mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge object with $merge in reverse', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply transform from an operation object with Symbol as key', async (t) => {
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

  const ret = await mapTransform(def, { transformers })(data)

  t.deepEqual(ret, expected)
})

test('should throw when transform is given an unknown transformer id', (t) => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: 'unknown' }],
    },
  ]

  const error = t.throws(() => mapTransform(def, { transformers }))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Transform operator was given the unknown transformer id 'unknown'"
  )
})

test('should throw when transform is given an unknown transformer id symbol', (t) => {
  const def = [
    {
      titleLength: ['content.heading', { $transform: Symbol.for('unknown') }],
    },
  ]

  const error = t.throws(() => mapTransform(def, { transformers }))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Transform operator was given the unknown transformer id 'Symbol(unknown)'"
  )
})

test('should throw when transform operation is missing a transformer id', (t) => {
  const def = [
    'content',
    {
      $iterate: true,
      title: ['heading', { $transform: null }], // No transformer id
    },
  ] as unknown as TransformDefinition

  const error = t.throws(() => mapTransform(def, { transformers }))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    'Transform operator was given no transformer id or an invalid transformer id'
  )
})

test('should throw when transform operation has invalid transformer id', async (t) => {
  const def = [
    'content',
    {
      $iterate: true,
      title: ['heading', { $transform: { id: 13 } }], // Just something invalid
    },
  ] as unknown as TransformDefinition

  const error = t.throws(() => mapTransform(def, { transformers }))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    'Transform operator was given no transformer id or an invalid transformer id'
  )
})

test('should run operation objects trought modifyOperationObject', async (t) => {
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

  const ret = await mapTransform(def, { transformers, modifyOperationObject })(
    data
  )

  t.deepEqual(ret, expected)
})
