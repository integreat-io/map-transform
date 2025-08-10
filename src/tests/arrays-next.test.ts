import test from 'node:test'
import assert from 'node:assert/strict'
import { mapTransformSync } from '../index.js'

// Tests

test('should map specified array over transform object', () => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }
  const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map specified array over transform object in reverse', () => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = [{ title: 'Heading 1' }, { title: 'Heading 2' }]
  const expected = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }

  const ret = mapTransformSync(def)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should iterate with iterate operation', () => {
  const def = [
    'content.articles',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }
  const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map array in transform object', () => {
  const def = [
    {
      'entries[]': {
        title: 'content.heading',
      },
      'authors[]': ['content.author'],
    },
  ]
  const data = [
    { content: { heading: 'Heading 1', author: 'johnf' } },
    { content: { heading: 'Heading 2', author: 'lucyk' } },
  ]
  const expected = {
    entries: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
    authors: ['johnf', 'lucyk'],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map several layers of arrays', () => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      attributes: {
        title: 'content.heading',
      },
      relationships: {
        'topics[].id': 'meta.keywords',
        'author.id': 'meta.user_id',
      },
    },
  ]
  const data = {
    content: {
      articles: [
        {
          content: { heading: 'Heading 1' },
          meta: { keywords: ['news', 'latest'], ['user_id']: 'johnf' },
        },
        {
          content: { heading: 'Heading 2' },
          meta: { keywords: ['tech'], ['user_id']: 'maryk' },
        },
      ],
    },
  }
  const expected = [
    {
      attributes: { title: 'Heading 1' },
      relationships: {
        topics: [{ id: 'news' }, { id: 'latest' }],
        author: { id: 'johnf' },
      },
    },
    {
      attributes: { title: 'Heading 2' },
      relationships: { topics: [{ id: 'tech' }], author: { id: 'maryk' } },
    },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should flatten arrays', () => {
  const def = [
    'content.articles[].content[]',
    {
      $iterate: true,
      attributes: {
        title: 'heading',
      },
    },
  ]
  const data = {
    content: {
      articles: [
        {
          content: [{ heading: 'Heading 1' }, { heading: 'Heading 2' }],
        },
      ],
    },
  }
  const expected = [
    { attributes: { title: 'Heading 1' } },
    { attributes: { title: 'Heading 2' } },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map empty array as empty array', () => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data: unknown[] = []
  const expected: unknown[] = []

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with object array path', () => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
        { content: { heading: 'Heading 3' } },
      ],
    },
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' },
    { title: 'Heading 3' },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should handle array paths in object mappings', () => {
  const def = {
    $iterate: true,
    id: 'key',
    relationships: {
      'sections[]': 'sections',
    },
  }
  const data = [{ key: 'ent1', sections: ['news', 'sports'] }, { key: 'ent2' }]
  const expected = [
    { id: 'ent1', relationships: { sections: ['news', 'sports'] } },
    { id: 'ent2', relationships: { sections: [] } },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with array index path', () => {
  const def = [
    'content.articles[1]',
    {
      title: 'content.heading',
    },
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }
  const expected = { title: 'Heading 2' }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with array index in middle of path', () => {
  const def = ['content.articles[0].content.heading']
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }
  const expected = 'Heading 1'

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set several props in array', () => {
  const def = {
    'props[0].key': { $value: 'prop1' },
    'props[0].value': 'content.prop1',
    'props[1].key': { $value: 'prop2' },
    'props[1].value': 'content.prop2',
  }
  const data = {
    content: {
      prop1: 'Value 1',
      prop2: 'Value 2',
    },
  }
  const expected = {
    props: [
      { key: 'prop1', value: 'Value 1' },
      { key: 'prop2', value: 'Value 2' },
    ],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set several props in array with depth', () => {
  const def = {
    'items[0].props[0].key': { $value: 'prop1' },
    'items[0].props[0].value': 'content.prop1',
    'items[0].props[1].key': { $value: 'prop2' },
    'items[0].props[1].value': 'content.prop2',
  }
  const data = {
    content: {
      prop1: 'Value 1',
      prop2: 'Value 2',
    },
  }
  const expected = {
    items: [
      {
        props: [
          { key: 'prop1', value: 'Value 1' },
          { key: 'prop2', value: 'Value 2' },
        ],
      },
    ],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should return undefined from non-matching path with array index in middle', () => {
  const def = ['content.articles[0].content.heading']
  const data = {
    content: {
      articles: {
        content: {
          heading: 'Heading 1',
        },
      },
    },
  }
  const expected = undefined

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with root array path', () => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = [{ title: 'Heading 1' }, { title: 'Heading 2' }]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map array of objects', () => {
  const def = {
    $iterate: true,
    content: {
      heading: 'title',
    },
    meta: {
      writer: {
        username: 'author',
      },
    },
  }
  const data = [
    { title: 'The heading', author: 'johnf' },
    { title: 'Second heading', author: 'maryk' },
  ]
  const expected = [
    {
      content: { heading: 'The heading' },
      meta: { writer: { username: 'johnf' } },
    },
    {
      content: { heading: 'Second heading' },
      meta: { writer: { username: 'maryk' } },
    },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set empty data array', () => {
  const def = [
    {
      'items[]': {
        title: 'heading',
      },
    },
  ]
  const data: unknown[] = []
  const expected = {
    items: [],
  }

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})

test('should not hijack array', () => {
  const def = {
    $iterate: true,
    content: { title: 'heading' },
    meta: {
      'sections[].id': 'tags',
    },
  }
  const data = [
    { heading: 'Entry 1', tags: ['news', 'top_ten'] },
    { heading: 'Entry 2', tags: ['news'] },
  ]
  const expected = [
    {
      content: { title: 'Entry 1' },
      meta: { sections: [{ id: 'news' }, { id: 'top_ten' }] },
    },
    { content: { title: 'Entry 2' }, meta: { sections: [{ id: 'news' }] } },
  ]

  const ret = mapTransformSync(def)(data)

  assert.deepEqual(ret, expected)
})
