import test from 'ava'

import { mapTransform, get, set, fwd, rev, root, plug, lookup } from '..'

test('should map with object path', (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1' }
      }
    }
  }
  const expected = { title: 'Heading 1' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object shape', (t) => {
  const def = {
    attributes: {
      title: 'content.heading',
      text: 'content.copy'
    },
    relationships: {
      author: 'meta.writer.username'
    }
  }
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    attributes: {
      title: 'The heading',
      text: 'A long text'
    },
    relationships: {
      author: 'johnf'
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip slashed properties going forward', (t) => {
  const def = [
    'content.article',
    {
      title: 'content.heading',
      'title/1': 'content.title',
      'title/2': 'title'
    }
  ]
  const data = {
    content: {
      article: {
        content: { heading: 'Heading 1', title: 'Heading 2' },
        title: 'Heading 3'
      }
    }
  }
  const expected = { title: 'Heading 1' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root path', (t) => {
  const def = [
    {
      attributes: {
        title: 'content.heading',
        section: '$meta.section'
      }
    }
  ]
  const data = {
    content: { heading: 'The heading', copy: 'A long text' },
    meta: { section: 'news' }
  }
  const expected = {
    attributes: {
      title: 'The heading',
      section: 'news'
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with lookup', (t) => {
  const def = {
    title: 'content.heading',
    authors: ['content.authors[]', [lookup('$meta.users[]', 'id'), get('name')]]
  }
  const data = {
    content: { heading: 'The heading', authors: ['user1', 'user3'] },
    meta: {
      users: [
        { id: 'user1', name: 'User 1' },
        { id: 'user2', name: 'User 2' },
        { id: 'user3', name: 'User 3' }
      ]
    }
  }
  const expected = {
    title: 'The heading',
    authors: ['User 1', 'User 3']
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set current value on path', (t) => {
  const def = [
    'ids[]',
    {
      id: '.'
    }
  ]
  const data = {
    ids: ['ent1', 'ent2']
  }
  const expected = [
    { id: 'ent1' },
    { id: 'ent2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined', (t) => {
  const def = [
    'items[]',
    { title: 'content.heading' }
  ]
  const data = undefined
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined from path to empty array', (t) => {
  const def = [
    'items[]',
    { title: 'content.heading' }
  ]
  const data = { items: undefined }
  const expected: any[] = []

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map array with object path', (t) => {
  const def = [
    'content.articles',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map several layers of arrays', (t) => {
  const def = [
    'content.articles[]',
    {
      attributes: {
        title: 'content.heading'
      },
      relationships: {
        'topics[].id': 'meta.keywords',
        'author.id': 'meta.user_id'
      }
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' }, meta: { keywords: ['news', 'latest'], user_id: 'johnf' } },
        { content: { heading: 'Heading 2' }, meta: { keywords: ['tech'], user_id: 'maryk' } }
      ]
    }
  }
  const expected = [
    {
      attributes: { title: 'Heading 1' },
      relationships: { topics: [{ id: 'news' }, { id: 'latest' }], author: { id: 'johnf' } }
    },
    {
      attributes: { title: 'Heading 2' },
      relationships: { topics: [{ id: 'tech' }], author: { id: 'maryk' } }
    }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map empty array as empty array', (t) => {
  const def = {
    title: 'content.heading'
  }
  const data: any[] = []
  const expected: any[] = []

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object array path', (t) => {
  const def = [
    'content.articles[]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } },
        { content: { heading: 'Heading 3' } }
      ]
    }
  }
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' },
    { title: 'Heading 3' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should handle array paths in object mappings', (t) => {
  const def = [
    {
      id: 'key',
      relationships: {
        sections: 'sections[]'
      }
    }
  ]
  const data = [
    { key: 'ent1', sections: ['news', 'sports'] },
    { key: 'ent2' }
  ]
  const expected = [
    { id: 'ent1', relationships: { sections: ['news', 'sports'] } },
    { id: 'ent2', relationships: { sections: [] } }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map null as empty array', (t) => {
  const def = [
    'content.articles[]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: null
    }
  }
  const expected: any[] = []

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array index path', (t) => {
  const def = [
    'content.articles[1]',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = { title: 'Heading 2' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array index in middle of path', (t) => {
  const def = [
    'content.articles[0].content.heading'
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = 'Heading 1'

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with value array', (t) => {
  const def = {
    data: {
      'items[]': [
        {
          title: 'headline'
        }
      ]
    }
  }
  const data = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]
  const expected = {
    data: {
      items: [
        { title: 'Entry 1' },
        { title: 'Entry 2' }
      ]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root operation', (t) => {
  const def = [
    'content',
    {
      attributes: {
        title: 'heading'
      },
      relationships: {
        author: root('meta.writer.username')
      }
    }
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    attributes: {
      title: 'The heading'
    },
    relationships: {
      author: 'johnf'
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined from non-matching path with array index in middle', (t) => {
  const def = [
    'content.articles[0].content.heading'
  ]
  const data = {
    content: {
      articles: {
        content: {
          heading: 'Heading 1'
        }
      }
    }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not map fields without paths', (t) => {
  const def = {
    title: null,
    author: 'meta.writer.username'
  }
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    author: 'johnf'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root array path', (t) => {
  const def = [
    '[]',
    {
      title: 'content.heading'
    }
  ]
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = [
    { title: 'Heading 1' },
    { title: 'Heading 2' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map data as is when no mapping', (t) => {
  const def = ['content']
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    heading: 'The heading'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.todo('should split mappings with array path in the middle')

test('should map with nested mappings', (t) => {
  const def = {
    content: {
      'articles[]': [
        {
          title: 'content.heading'
        }
      ]
    }
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = {
    content: {
      articles: [
        { title: 'Heading 1' },
        { title: 'Heading 2' }
      ]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should forward map with directional paths', (t) => {
  const def = [
    fwd(get('content.articles[]')),
    rev(get('wrong.path[]')),
    {
      title: 'content.heading'
    },
    fwd(set('items[]')),
    rev(set('wrong.path[]'))
  ]
  const data = {
    content: {
      articles: [
        { content: { heading: 'Heading 1' } },
        { content: { heading: 'Heading 2' } }
      ]
    }
  }
  const expected = {
    items: [
      { title: 'Heading 1' },
      { title: 'Heading 2' }
    ]
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set to undefined when moving forward', (t) => {
  const def = {
    title: [fwd(plug()), rev('content.heading')]
  }
  const data = { content: { heading: 'Heading 1' } }
  const expected = { title: undefined }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map array of objects', (t) => {
  const def = {
    content: {
      heading: 'title'
    },
    meta: {
      writer: {
        username: 'author'
      }
    }
  }
  const data = [
    { title: 'The heading', author: 'johnf' },
    { title: 'Second heading', author: 'maryk' }
  ]
  const expected = [
    {
      content: { heading: 'The heading' },
      meta: { writer: { username: 'johnf' } }
    },
    {
      content: { heading: 'Second heading' },
      meta: { writer: { username: 'maryk' } }
    }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with sub pipeline', (t) => {
  const def = [
    'content',
    ['articles']
  ]
  const data = {
    content: { articles: [{ id: 'ent1' }, { id: 'ent2' }] }
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping def', (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined when mapping def is empty object', (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]

  const ret = mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should try to map even when no data is given', (t) => {
  const def = {
    title: 'content.heading'
  }
  const expected = {
    title: undefined
  }

  const ret = mapTransform(def)(null)

  t.deepEqual(ret, expected)
})

test('should set empty data array', (t) => {
  const def = {
    'items[]': [
      {
        title: 'heading'
      }
    ]
  }
  const data: any[] = []
  const expected = {
    items: []
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
