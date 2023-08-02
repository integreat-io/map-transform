import test from 'ava'

import mapTransform, { transform, apply, fwd, rev, filter } from '../index.js'

// Setup

const castEntry = [
  fwd(filter(() => async () => true)),
  rev(transform(() => async (data) => data)),
  {
    $iterate: true,
    id: 'id',
    title: ['title', transform(() => async (value) => String(value))],
    viewCount: ['viewCount', transform(() => async (value) => Number(value))],
  },
  fwd(transform(() => async (data) => data)),
  rev(filter(() => async () => true)),
]

const getItems = 'data.entries'

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

const pipelines = {
  cast_entry: castEntry,
  getItems,
  [Symbol.for('getItems')]: getItems,
  hitsOnly,
  entry: entryMutation,
}

const options = { pipelines }

// Tests

test('should apply pipeline by id', async (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply('cast_entry'),
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id', async (t) => {
  const def = [
    apply('getItems'),
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id as Symbol', async (t) => {
  const def = [
    apply(Symbol.for('getItems')),
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline by id in reverse', async (t) => {
  const def = [
    apply('getItems'),
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

  const ret = await mapTransform(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply pipeline as operation object', async (t) => {
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should iterate applied pipeline', async (t) => {
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline from array path', async (t) => {
  const def = { data: ['content.data[].createOrMutate', apply('entry')] }
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline from array path in reverse', async (t) => {
  const def = {
    data: ['content.data[].createOrMutate', apply('entry')],
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

  const ret = await mapTransform(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should apply pipeline as operation object going forward only', async (t) => {
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'fwd' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: 45, id: undefined }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = await mapTransform(def, options)(dataFwd)
  const retRev = await mapTransform(def, options)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should apply pipeline as operation object going in reverse only', async (t) => {
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

  const retFwd = await mapTransform(def, options)(dataFwd)
  const retRev = await mapTransform(def, options)(dataRev, { rev: true })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should use forward alias', async (t) => {
  const optionsWithAlias = { ...options, fwdAlias: 'from' }
  const def = [
    { title: 'content.heading', viewCount: 'meta.hits' },
    { $apply: 'cast_entry', $direction: 'from' },
  ]
  const dataFwd = { content: { heading: 'The heading' }, meta: { hits: '45' } }
  const expectedFwd = { title: 'The heading', viewCount: 45, id: undefined }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = await mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = await mapTransform(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should use reverse alias', async (t) => {
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

  const retFwd = await mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = await mapTransform(def, optionsWithAlias)(dataRev, {
    rev: true,
  })

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})

test('should apply path pipeline through operaion object with id as Symbol', async (t) => {
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

  const ret = await mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should throw when applying an unknown pipeline id', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply('unknown'),
  ]

  const error = t.throws(() => mapTransform(def, options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})

test('should throw when applying an unknown pipeline id as Symbol', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    apply(Symbol.for('unknown')),
  ]

  const error = t.throws(() => mapTransform(def, options))

  t.true(error instanceof Error)
  t.is(
    error?.message,
    "Failed to apply pipeline 'Symbol(unknown)'. Unknown pipeline"
  )
})

test('should throw when applying an unknown pipeline as operation object', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'unknown' },
  ]

  const error = t.throws(() => mapTransform(def, options))

  t.true(error instanceof Error)
  t.is(error?.message, "Failed to apply pipeline 'unknown'. Unknown pipeline")
})
