import test from 'ava'

import { mapTransform, get, set, fwd, rev, alt, root, plug, lookup } from '..'

test('should map with object path', t => {
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

test('should get object from alt path', t => {
  const def = [
    'Content.Article',
    fwd(alt('content.article')),
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

test('should map with object shape', t => {
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

test('should map null values path', t => {
  const def = [
    'content.article',
    {
      title: 'content.heading'
    }
  ]
  const data = {
    content: {
      article: {
        content: { heading: null }
      }
    }
  }
  const expected = { title: null }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should allow colons in paths', t => {
  const def = [
    {
      'b:title': 'content.a:heading'
    }
  ]
  const data = { content: { 'a:heading': 'Heading 1' } }
  const expected = { 'b:title': 'Heading 1' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should skip slashed properties going forward', t => {
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

test('should map with root path', t => {
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

test('should map with lookup', t => {
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

test('should spread array to mapping objects', t => {
  const def = [
    'ids[]',
    {
      $iterate: true,
      id: '.'
    }
  ]
  const data = {
    ids: ['ent1', 'ent2']
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map undefined to undefined', t => {
  const def = ['items[]', { attributes: { title: 'content.heading' } }]
  const data = undefined
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with root operation', t => {
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

test('should not map fields without pipeline', t => {
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

test('should map data as is when no mapping', t => {
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

test('should map with nested mappings', t => {
  const def = [
    {
      content: {
        'articles[]': [
          {
            $iterate: true,
            title: 'content.heading'
          }
        ]
      }
    }
  ]
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = {
    content: {
      articles: [{ title: 'Heading 1' }, { title: 'Heading 2' }]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should forward map with directional paths', t => {
  const def = [
    fwd(get('content.articles[]')),
    rev(get('wrong.path[]')),
    {
      $iterate: true,
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
    items: [{ title: 'Heading 1' }, { title: 'Heading 2' }]
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set to undefined when moving forward', t => {
  const def = {
    title: [fwd(plug()), rev('content.heading')]
  }
  const data = { content: { heading: 'Heading 1' } }
  const expected = { title: undefined }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with sub pipeline', t => {
  const def = ['content', ['articles']]
  const data = {
    content: { articles: [{ id: 'ent1' }, { id: 'ent2' }] }
  }
  const expected = [{ id: 'ent1' }, { id: 'ent2' }]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping def', t => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return undefined when mapping def is empty object', t => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]

  const ret = mapTransform(def)(data)

  t.is(ret, undefined)
})

test('should try to map even when no data is given', t => {
  const def = {
    title: 'content.heading'
  }
  const expected = {
    title: undefined
  }

  const ret = mapTransform(def)(null)

  t.deepEqual(ret, expected)
})
