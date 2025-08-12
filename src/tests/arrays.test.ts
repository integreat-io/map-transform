import test from 'node:test'
import assert from 'node:assert/strict'
import merge from '../operations/merge.js'
import iterate from '../operations/iterate.js'

import mapTransform, { set, transform, transformers } from '../index.js'
const { value } = transformers

// Tests

test('should map specified array over transform object', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map specified array over transform object in reverse', async () => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should iterate with iterate operation', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map array in transform object', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map several layers of arrays', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map several layers of arrays - seperate pipelines', async () => {
  const def = [
    'content.articles[]',
    iterate(
      merge(
        ['content.heading', set('attributes.title')],
        ['meta.keywords', set('relationships.topics[].id')],
        ['meta.user_id', set('relationships.author.id')],
      ),
    ),
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should flatten arrays', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map empty array as empty array', async () => {
  const def = {
    $iterate: true,
    title: 'content.heading',
  }
  const data: unknown[] = []
  const expected: unknown[] = []

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with object array path', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should handle array paths in object mappings', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with array index path', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with array index in middle of path', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set several props in array', async () => {
  const def = {
    'props[0].key': transform(value('prop1')),
    'props[0].value': 'content.prop1',
    'props[1].key': transform(value('prop2')),
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set several props in array with depth', async () => {
  const def = {
    'items[0].props[0].key': transform(value('prop1')),
    'items[0].props[0].value': 'content.prop1',
    'items[0].props[1].key': transform(value('prop2')),
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should return undefined from non-matching path with array index in middle', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map with root array path', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should map array of objects', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should set empty data array', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should not hijack array', async () => {
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

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should create an array with the array operation', async () => {
  const def = {
    $array: [
      'content.articles[0].heading',
      'content.articles[1].subheading',
      { $value: 'What?' },
    ],
  }
  const data = {
    content: {
      articles: [
        { heading: 'Heading 1', subheading: 'Sub 1' },
        { heading: 'Heading 2', subheading: 'Sub 2' },
      ],
    },
  }
  const expected = ['Heading 1', 'Sub 2', 'What?']

  const ret = await mapTransform(def)(data)

  assert.deepEqual(ret, expected)
})

test('should recreate the original object as far as possible with the array operation in reverse', async () => {
  const def = {
    $array: ['content.articles[0].heading', 'content.articles[1].subheading'],
  }
  const data = ['Heading 1', 'Sub 2']
  const expected = {
    content: {
      articles: [{ heading: 'Heading 1' }, { subheading: 'Sub 2' }],
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  assert.deepEqual(ret, expected)
})

test('should create an array with the array operation when flipped in rev', async () => {
  const def = {
    $array: [
      'content.articles[0].heading',
      'content.articles[1].subheading',
      { $value: 'What?' },
    ],
    $flip: true,
  }
  const data = {
    content: {
      articles: [
        { heading: 'Heading 1', subheading: 'Sub 1' },
        { heading: 'Heading 2', subheading: 'Sub 2' },
      ],
    },
  }
  const expected = ['Heading 1', 'Sub 2', 'What?']

  const ret = await mapTransform(def)(data, { rev: true })

  assert.deepEqual(ret, expected)
})
