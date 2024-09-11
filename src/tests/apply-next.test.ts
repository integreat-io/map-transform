import test from 'ava'
import { mapTransformSync, mapTransformAsync } from '../index.js'

// Setup

const isTrue = () => () => () => true
const dontTouch = () => () => (value: unknown) => value
const dontTouchAsync = () => () => async (value: unknown) => value
const castNumber = () => () => (value: unknown) => Number(value)
const castString = () => () => (value: unknown) => String(value)

const transformers = {
  isTrue,
  dontTouch,
  dontTouchAsync,
  castNumber,
  castString,
}

const castEntry = [
  { $filter: 'isTrue', $direction: 'fwd' },
  { $transform: 'dontTouch', $direction: 'rev' },
  {
    $iterate: true,
    id: 'id',
    title: ['title', { $transform: 'castString' }],
    viewCount: ['viewCount', { $transform: 'castNumber' }],
  },
  { $transform: 'dontTouch', $direction: 'fwd' },
  { $filter: 'isTrue', $direction: 'rev' },
]

const getItems = 'data.entries'
const getItemsAsync = ['data.entries', { $transform: 'dontTouchAsync' }]

const entryMutation = [
  'items[]',
  {
    $iterate: true,
    id: 'key',
    title: 'header',
    source: '^^params.source',
    viewCount: 'views',
  },
  { $apply: 'cast_entry' },
]

const hitsOnly = { hits: 'meta.hits' }

const recursive = {
  id: 'key',
  title: 'heading',
  comments: ['children[]', { $apply: 'recursive', $iterate: true }],
}

const pipelines = {
  cast_entry: castEntry,
  getItems,
  getItemsAsync,
  [Symbol.for('getItems')]: getItems,
  hitsOnly,
  entry: entryMutation,
  recursive,
}

const options = { pipelines, transformers }

// Tests

test('should apply pipeline by id', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'cast_entry' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }
  const expected = {
    id: undefined,
    title: 'The heading',
    viewCount: 45,
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id', (t) => {
  const def = [
    { $apply: 'getItems' },
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id as Symbol', (t) => {
  const def = [
    { $apply: Symbol.for('getItems') },
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline by id in reverse', (t) => {
  const def = [
    { $apply: 'getItems' },
    {
      title: 'content.heading',
    },
  ]
  const data = {
    title: 'The heading',
  }
  const expected = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply async pipeline', async (t) => {
  const def = [
    { $apply: 'getItemsAsync' },
    {
      title: 'content.heading',
    },
  ]
  const data = {
    data: {
      entries: {
        content: { heading: 'The heading' },
      },
    },
  }
  const expected = {
    title: 'The heading',
  }

  const ret = await mapTransformAsync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should iterate applied pipeline', (t) => {
  const def = [{ $apply: 'hitsOnly', $iterate: true }]
  const data = [
    {
      content: { heading: 'The heading' },
      meta: { hits: '45' },
    },
    {
      content: { heading: 'The next heading' },
      meta: { hits: '111' },
    },
  ]
  const expected = [
    {
      hits: '45',
    },
    {
      hits: '111',
    },
  ]

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline from array path', (t) => {
  const def = { data: ['content.data[].createOrMutate', { $apply: 'entry' }] }
  const data = {
    content: {
      data: [
        {
          createOrMutate: {
            items: [
              {
                key: 'ent1',
                header: 'The heading',
                views: 42,
              },
            ],
          },
        },
      ],
    },
  }
  const expected = {
    data: [
      {
        id: 'ent1',
        title: 'The heading',
        viewCount: 42,
      },
    ],
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline from array path in reverse', (t) => {
  const def = {
    data: ['content.data[].createOrMutate', { $apply: 'entry' }],
  }
  const data = {
    data: [
      {
        id: 'ent1',
        title: 'The heading',
        viewCount: 42,
      },
    ],
  }
  const expected = {
    content: {
      data: [
        {
          createOrMutate: {
            items: [
              {
                key: 'ent1',
                header: 'The heading',
                views: 42,
              },
            ],
          },
        },
      ],
    },
  }

  const ret = mapTransformSync(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply pipeline as operation object going forward only', (t) => {
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'fwd' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { id: undefined, title: 'The heading', viewCount: 45 }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = mapTransformSync(def, options)(dataFwd)
  const retRev = mapTransformSync(def, options)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should apply pipeline as operation object going in reverse only', (t) => {
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'rev' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: '45' }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: 45 },
  }

  const retFwd = mapTransformSync(def, options)(dataFwd)
  const retRev = mapTransformSync(def, options)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should use forward alias', (t) => {
  const optionsWithAlias = { ...options, fwdAlias: 'from' }
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'from' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { id: undefined, title: 'The heading', viewCount: 45 }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = mapTransformSync(def, optionsWithAlias)(dataFwd)
  const retRev = mapTransformSync(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should use reverse alias', (t) => {
  const optionsWithAlias = { ...options, revAlias: 'to' }
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'to' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: '45' }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: 45 },
  }

  const retFwd = mapTransformSync(def, optionsWithAlias)(dataFwd)
  const retRev = mapTransformSync(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should handle pipelines that applies themselves', (t) => {
  const def = [{ $apply: 'recursive' }]
  const data = {
    key: 'ent1',
    heading: 'Entry 1',
    children: [
      {
        key: 'ent1.1',
        heading: 'Entry 1.1',
      },
      {
        key: 'ent1.2',
        heading: 'Entry 1.2',
      },
    ],
  }
  const expected = {
    id: 'ent1',
    title: 'Entry 1',
    comments: [
      {
        id: 'ent1.1',
        title: 'Entry 1.1',
        comments: [],
      },
      {
        id: 'ent1.2',
        title: 'Entry 1.2',
        comments: [],
      },
    ],
  }

  const ret = mapTransformSync(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should throw when applying an unknown pipeline id', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'unknown' },
  ]

  const error = t.throws(() => mapTransformSync(def, options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when applying an unknown pipeline id as Symbol', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: Symbol.for('unknown') },
  ]

  const error = t.throws(() => mapTransformSync(def, options))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Failed to apply pipeline 'Symbol(unknown)'. Unknown pipeline",
  )
})

test('should throw when applying an unknown pipeline in a provided pipeline', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'ourPipeline' },
  ]
  const ourPipeline = [{ $apply: 'unknownInPipeline' }]
  const options = { pipelines: { ourPipeline } }

  const error = t.throws(() => mapTransformSync(def, options))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Failed to apply pipeline 'unknownInPipeline'. Unknown pipeline",
  )
})

test('should throw when applying an unknown pipeline inside an operation', (t) => {
  const def = [
    {
      $if: { $apply: 'unknown' },
      then: {
        title: 'content.heading',
        viewCount: 'meta.hits',
      },
    },
  ]

  const error = t.throws(() => mapTransformSync(def, options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when applying an unknown pipeline inside a transform object', (t) => {
  const def = [
    {
      title: ['content.heading', { $apply: 'unknown' }],
      viewCount: 'meta.hits',
    },
  ]

  const error = t.throws(() => mapTransformSync(def, options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})
