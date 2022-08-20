import test from 'ava'

import { mapTransform, transform, apply, fwd, rev, filter } from '..'

// Setup

// TODO: Figure out why we have the fwd and rev operations here, and why they don't work
const castEntry = [
  fwd(filter(() => true)),
  rev(transform((data) => data)),
  {
    $iterate: true,
    id: 'id',
    title: ['title', transform(String)],
    viewCount: ['viewCount', transform(Number)],
  },
  fwd(transform((data) => data)),
  rev(filter(() => true)),
]

const getItems = 'data.entries'

const entryMutation = [
  'items[]',
  {
    $iterate: true,
    id: 'key',
    title: 'header',
    source: '^params.source',
    viewCount: 'views',
  },
  { $apply: 'cast_entry' },
]

const hitsOnly = { hits: 'meta.hits' }

const pipelines = {
  cast_entry: castEntry,
  getItems,
  hitsOnly,
  entry: entryMutation,
}

const options = { pipelines }

// Tests

test('should apply pipeline by id', (t) => {
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

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply path pipeline by id', (t) => {
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

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline by id in reverse', (t) => {
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

  const ret = mapTransform(def, options).rev(data)

  t.deepEqual(ret, expected)
})

test('should not touch value when no pipelines are supplied', (t) => {
  const options = {} // No pipelines
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
  const expected = { title: 'The heading', viewCount: '45' }

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline as operation object', (t) => {
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

  const ret = mapTransform(def, options)(data)

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

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test('should apply pipeline from array path', (t) => {
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

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, expected)
})

test.failing('should apply pipeline from array path in reverse', (t) => {
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

  const ret = mapTransform(def, options).rev(data)

  t.deepEqual(ret, expected)
})

test('should return value on unknown pipeline in operation object', (t) => {
  const def = [
    {
      title: 'content.heading',
      viewCount: 'meta.hits',
    },
    { $apply: 'unknown' },
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const ret = mapTransform(def, options)(data)

  t.deepEqual(ret, { title: 'The heading', viewCount: '45' })
})

test('should apply pipeline as operation object going forward only', (t) => {
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

  const retFwd = mapTransform(def, options)(dataFwd)
  const retRev = mapTransform(def, options).rev(dataRev)

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

  const retFwd = mapTransform(def, options)(dataFwd)
  const retRev = mapTransform(def, options).rev(dataRev)

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
  const expectedFwd = { title: 'The heading', viewCount: 45, id: undefined }
  const dataRev = { title: 'The heading', viewCount: '45' }
  const expectedRev = {
    content: { heading: 'The heading' },
    meta: { hits: '45' },
  }

  const retFwd = mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = mapTransform(def, optionsWithAlias).rev(dataRev)

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

  const retFwd = mapTransform(def, optionsWithAlias)(dataFwd)
  const retRev = mapTransform(def, optionsWithAlias).rev(dataRev)

  t.deepEqual(retFwd, expectedFwd)
  t.deepEqual(retRev, expectedRev)
})
