import test from 'ava'

import {
  mapTransform,
  get,
  set,
  fwd,
  rev,
  lookup,
  value,
  transform,
} from '../index.js'

// Setup

const threeLetters = (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 3) : value

// Tests

test('should reverse map simple object', (t) => {
  const def = {
    title: 'content.heading',
    author: 'meta.writer.username',
  }
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with dot only notation', (t) => {
  const def = {
    article: {
      '.': 'content',
      title: 'content.heading',
      heading: value('Just in:'),
    },
  }
  const data = {
    article: {
      heading: 'Just in:',
      title: 'The heading',
      abstract: 'So it begins ...',
    },
  }
  const expected = {
    content: {
      heading: 'The heading',
      abstract: 'So it begins ...',
      title: 'The heading',
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map array of objects', (t) => {
  const def = {
    $iterate: true,
    title: 'content.heading',
    author: 'meta.writer.username',
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

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with object array path', (t) => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      title: 'content.heading',
      abstract: 'content.intro',
    },
  ]
  const data = [
    { title: 'Heading 1', abstract: 'Read on' },
    { title: 'Heading 2', abstract: 'This is good' },
  ]
  const expected = {
    content: {
      articles: [
        { content: { heading: 'Heading 1', intro: 'Read on' } },
        { content: { heading: 'Heading 2', intro: 'This is good' } },
      ],
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map several layers', (t) => {
  const def = [
    'content.articles',
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
    attributes: { title: 'Heading 1' },
    relationships: {
      topics: [{ id: 'news' }, { id: 'latest' }],
      author: { id: 'johnf' },
    },
  }
  const expected = {
    content: {
      articles: {
        content: { heading: 'Heading 1' },
        meta: { keywords: ['news', 'latest'], ['user_id']: 'johnf' },
      },
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map several layers of arrays', (t) => {
  const def = [
    'content.articles[]',
    {
      $iterate: true,
      attributes: {
        title: 'content.heading',
      },
      relationships: {
        'topics[].id': 'meta.keywords[]',
        'author.id': 'meta.user_id',
      },
    },
  ]
  const data = [
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
  const expected = {
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

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should set several props in array in reverse', (t) => {
  const def = {
    'content.prop1': 'props[0].value',
    'content.prop2': 'props[1].value',
  }
  const data = {
    content: {
      prop1: 'Value 1',
      prop2: 'Value 2',
    },
  }
  const expected = {
    props: [{ value: 'Value 1' }, { value: 'Value 2' }],
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with null value', (t) => {
  const def = {
    title: 'content.heading',
  }
  const data = {
    title: null,
  }
  const expected = {
    content: { heading: null },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should use slashed properties in reverse', (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
      'title/1': 'content.title',
      'title/2': 'title',
    },
  ]
  const data = { title: 'Heading 1' }
  const expected = {
    content: {
      article: {
        content: { heading: 'Heading 1', title: 'Heading 1' },
        title: 'Heading 1',
      },
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with root array path', (t) => {
  const def = [
    '[]',
    {
      $iterate: true,
      title: 'content.heading',
    },
  ]
  const data = [{ title: 'Heading 1' }, { title: 'Heading 2' }]
  const expected = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object in reverse', (t) => {
  const def = {
    $modify: true,
    name: 'title',
  }
  const data = {
    name: 'The real title',
    title: 'Oh, this must go',
    text: 'This is high quality content for sure',
  }
  const expected = {
    name: 'The real title',
    title: 'The real title',
    text: 'This is high quality content for sure',
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object in reverse - flipped', (t) => {
  const def = {
    $flip: true,
    article: {
      $modify: 'content',
      title: 'name',
    },
  }
  const data = {
    name: 'The real title',
    content: {
      title: 'Oh, this must go',
      text: 'This is high quality content for sure',
    },
  }
  const expected = {
    article: {
      title: 'The real title',
      text: 'This is high quality content for sure',
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object with $direction: fwd', (t) => {
  const def = {
    $direction: 'fwd',
    title: 'content.heading',
    author: 'meta.writer.username',
  }
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = data

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should skip transform object when $direction is fwdAlias', (t) => {
  const options = { fwdAlias: 'from' }
  const def = {
    $direction: 'from',
    title: 'content.heading',
    author: 'meta.writer.username',
  }
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = data

  const ret = mapTransform(def, options).rev(data)

  t.deepEqual(ret, expected)
})

test('should treat lookup as get in reverse', (t) => {
  const def = {
    title: 'content.heading',
    authors: [
      'content.authors[]',
      lookup({ arrayPath: '^meta.users[]', propPath: 'id' }),
    ],
  }
  const data = {
    title: 'The heading',
    authors: [
      { id: 'user1', name: 'User 1' },
      { id: 'user3', name: 'User 3' },
    ],
  }
  const expected = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map data as is when no mapping', (t) => {
  const def = ['content']
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const expected = {
    content: {
      title: 'The heading',
      author: 'johnf',
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with nested mapping', (t) => {
  const def = {
    'content.articles[]': {
      title: 'content.heading',
    },
  }
  const data = {
    content: {
      articles: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
    },
  }
  const expected = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with directional paths', (t) => {
  const def = [
    fwd(get('wrong.path[]')),
    rev(get('content.articles[]')),
    {
      $iterate: true,
      title: 'content.heading',
    },
    fwd(set('wrong.path[]')),
    rev(set('items[]')),
  ]
  const data = {
    items: [{ title: 'Heading 1' }, { title: 'Heading 2' }],
  }
  const expected = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
      ],
    },
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with root path', (t) => {
  const def = [
    {
      title: 'item.heading',
      '^meta.section': 'section',
    },
    set('content'),
  ]
  const data = {
    content: { title: 'The heading' },
    meta: { section: 'news' },
  }
  const expected = {
    item: {
      heading: 'The heading',
    },
    section: 'news',
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with flipped mutate object', (t) => {
  const data = [
    { key: 'ent1', headline: 'Entry 1' },
    { key: 'ent2', headline: 'Entry 2' },
  ]
  const def = [
    'content',
    {
      $flip: true,
      $iterate: true,
      id: 'key',
      attributes: {
        title: ['headline', transform(threeLetters)],
        age: ['unknown'],
      },
      relationships: {
        author: value('johnf'),
      },
    },
  ]
  const expectedValue = {
    content: [
      {
        id: 'ent1',
        attributes: {
          title: 'Ent',
          age: undefined,
        },
        relationships: {
          author: 'johnf',
        },
      },
      {
        id: 'ent2',
        attributes: {
          title: 'Ent',
          age: undefined,
        },
        relationships: {
          author: 'johnf',
        },
      },
    ],
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expectedValue)
})

test('should return data when no mapping def and reverse mapping', (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = data

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should return undefined when mapping def is empty', (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = undefined

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined', (t) => {
  const def = ['items[]', { attributes: { title: 'content.heading' } }]
  const data = undefined
  const expected = undefined

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
