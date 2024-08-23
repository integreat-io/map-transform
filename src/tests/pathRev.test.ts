import test from 'ava'

import mapTransform, {
  get,
  set,
  fwd,
  rev,
  lookup,
  lookdown,
  transform,
  transformers,
} from '../index.js'
const { value } = transformers

// Setup

const threeLetters = () => async (value: unknown) =>
  typeof value === 'string' ? value.slice(0, 3) : value

// Tests

test('should reverse map simple object', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with target', async (t) => {
  const def = ['content.heading', '>title']
  const data = {
    title: 'The heading',
    author: 'johnf',
  }
  const target = {
    content: { id: 'ent1', heading: 'Default heading' },
  }
  const expected = {
    content: { id: 'ent1', heading: 'The heading' },
  }

  const ret = await mapTransform(def)(data, { target, rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with dot only notation', async (t) => {
  const def = {
    article: {
      '.': 'content',
      title: 'content.heading',
    },
  }
  const data = {
    article: {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should disregard a prop pipeline without get in reverse', async (t) => {
  const def = {
    title: 'content.heading',
    meta: transform(value({ tags: ['news'] })), // We're setting an object here, as that would replace the target object
  }
  const data = { title: 'New article', meta: { tags: ['news'] } }
  const expected = { content: { heading: 'New article' } }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should support defining get only-pipelines for reverse', async (t) => {
  const def = {
    title: 'content.heading',
    '/1': ['meta', transform(value({ value: { tags: ['news'] } }))], // We must wrap the value object in a props object
  }
  const data = { title: 'New article' }
  const expected = {
    content: { heading: 'New article' },
    meta: { tags: ['news'] },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map array of objects', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with object array path', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map several layers', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map several layers of arrays', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map several layers of arrays with bracket notation in set path', async (t) => {
  const def = {
    data: [
      'content.articles[]',
      {
        $iterate: true,
        title: 'heading',
        topics: 'keywords',
        'author.id': 'user_id',
      },
    ],
  }
  const data = {
    data: [
      {
        title: 'Heading 1',
        topics: [{ id: 'news' }, { id: 'latest' }],
        author: { id: 'johnf' },
      },
      {
        title: 'Heading 2',
        topics: [{ id: 'tech' }],
        author: { id: 'maryk' },
      },
      {
        title: 'Heading 3',
        topics: [],
        author: { id: 'maryk' },
      },
    ],
  }
  const expected = {
    content: {
      articles: [
        {
          heading: 'Heading 1',
          keywords: [{ id: 'news' }, { id: 'latest' }],
          ['user_id']: 'johnf',
        },
        {
          heading: 'Heading 2',
          keywords: [{ id: 'tech' }],
          ['user_id']: 'maryk',
        },
        {
          heading: 'Heading 3',
          keywords: [],
          ['user_id']: 'maryk',
        },
      ],
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should set several props in array in reverse', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with null value', async (t) => {
  const def = {
    title: 'content.heading',
  }
  const data = {
    title: null,
  }
  const expected = {
    content: { heading: null },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should use slashed properties in reverse', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with root array path', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object in reverse', async (t) => {
  const def = {
    $modify: true,
    '.': '$modify',
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object from a path in reverse', async (t) => {
  const def = {
    article: {
      $modify: 'article',
      '.': 'content.$modify',
      title: 'content.name',
    },
  }
  const data = {
    article: {
      title: 'The real title',
      name: 'Got to go',
      text: 'This is high quality content for sure',
    },
  }
  const expected = {
    content: {
      name: 'The real title',
      title: 'The real title',
      text: 'This is high quality content for sure',
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should shallow merge (modify) original object with transformed object in reverse - flipped', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should allow $flip to affect transform objects through pipelines', async (t) => {
  const def = {
    $flip: true,
    article: {
      title: 'name',
      sections: ['meta.tags', { $iterate: true, id: 'name' }], // This inner transform object should also be flipped
    },
  }
  const data = {
    name: 'The real title',
    meta: {
      tags: [
        { id: 1, name: 'news' },
        { id: 32, name: 'sports' },
      ],
    },
  }
  const expected = {
    article: {
      title: 'The real title',
      sections: [{ id: 'news' }, { id: 'sports' }],
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should treat get/set transformers and get/set paths the same even when flipped', async (t) => {
  const def = {
    $flip: true,
    article: [get('name'), set('title')],
  }
  const data = {
    name: 'The real title',
  }
  const expected = {
    article: {
      title: 'The real title',
    },
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should skip transform object with $direction: fwd', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should skip transform object when $direction is fwdAlias', async (t) => {
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

  const ret = await mapTransform(def, options)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should treat lookup as get in reverse', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should run lookup as normal in reverse when flipped', async (t) => {
  const def = {
    $flip: true,
    title: 'content.heading',
    authors: [
      'content.authors[]',
      lookup({ arrayPath: '^^.meta.users[]', propPath: 'id' }),
    ],
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const expected = {
    title: 'The heading',
    authors: [
      { id: 'user1', name: 'User 1' },
      { id: 'user3', name: 'User 3' },
    ],
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should map with lookdown', async (t) => {
  const def = {
    'content.heading': 'title',
    'content.authors': [
      'authors[]',
      set('name'),
      lookdown({ arrayPath: '^^meta.users[]', propPath: 'id' }),
    ],
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const expected = {
    title: 'The heading',
    authors: ['User 1', 'User 3'],
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should map with lookdown as transform object', async (t) => {
  const def = {
    'content.heading': 'title',
    'content.authors[]': [
      'authors',
      ['>name', { $lookdown: '^^.meta.users[]', path: 'id' }],
    ],
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' },
      ],
    },
  }
  const expected = {
    title: 'The heading',
    authors: ['User 1', 'User 3'],
  }

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should return map data as is when no mapping', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with nested mapping', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with directional paths', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with root path', async (t) => {
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should reverse map with flipped mutate object', async (t) => {
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
        author: transform(value('johnf')),
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

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expectedValue)
})

test('should return data when no mapping def and reverse mapping', async (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = data

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should return empty object when mapping def is empty', async (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } },
  ]
  const expected = {}

  const ret = await mapTransform(def)(data, { rev: true })

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined when noDefaults is true', async (t) => {
  const def = ['items[]', { attributes: { title: 'content.heading' } }]
  const data = undefined
  const expected = undefined

  const ret = await mapTransform(def)(data, { rev: true, noDefaults: true })

  t.deepEqual(ret, expected)
})
