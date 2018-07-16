import test from 'ava'

import mapTransform = require('..')

test('should map simple object', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    }
  }
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    title: 'The heading',
    author: 'johnf'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map array of objects', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    }
  }
  const data = [
    {
      content: { heading: 'The heading' },
      meta: { writer: { username: 'johnf' } }
    },
    {
      content: { heading: 'Second heading' },
      meta: { writer: { username: 'maryk' } }
    }
  ]
  const expected = [
    { title: 'The heading', author: 'johnf' },
    { title: 'Second heading', author: 'maryk' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array index path', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writers[0].username'
    }
  }
  const data = {
    content: { heading: 'The heading' },
    meta: { writers: [ { username: 'johnf' }, { username: 'maryk' } ] }
  }
  const expected = {
    title: 'The heading',
    author: 'johnf'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with array all path', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      authors: 'meta.writers[].id'
    }
  }
  const data = {
    content: { heading: 'The heading' },
    meta: { writers: [ { id: 'johnf' }, { id: 'maryk' } ] }
  }
  const expected = {
    title: 'The heading',
    authors: ['johnf', 'maryk']
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with empty field key', (t) => {
  const def = {
    mapping: {
      '': 'content'
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = { heading: 'The heading' }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use default value', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        default: 'Default heading',
        defaultRev: 'Wrong way'
      }
    }
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    { title: 'Default heading' },
    { title: 'From data' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading'
      }
    }
  }
  const data = [
    { content: {} },
    { content: { heading: 'From data' } }
  ]
  const expected = [
    { title: undefined },
    { title: 'From data' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map with object path', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    path: 'content.articles'
  }
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

test('should map with object pathTo', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    pathTo: 'content.articles'
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

test('should map with array pathTo', (t) => {
  const def = {
    mapping: {
      title: { path: 'content.heading' }
    },
    pathTo: 'content.articles[].item'
  }
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = {
    content: {
      articles: [
        { item: { title: 'Heading 1' } },
        { item: { title: 'Heading 2' } }
      ]
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping', (t) => {
  const def = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping', (t) => {
  const def = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
