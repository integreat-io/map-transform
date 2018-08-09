import test from 'ava'

import { mapTransform } from '..'

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

test('should try to map even when path points to a non-existing prop', (t) => {
  const def = [
    'missing',
    { title: 'title' }
  ]
  const data = {
    content: {
      title: 'Entry 1'
    }
  }
  const expected = {
    title: undefined
  }

  const ret = mapTransform(def)(data)

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
