import test from 'ava'

import mapTransform from '../lib'

test('should map simple object', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should map array of objects', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should map with array path', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should map with empty field key', (t) => {
  const mapping = {
    fields: {
      '': 'content'
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = { heading: 'The heading' }

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should use default value', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should set missing values to undefined when no default', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should map with object path', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should map with object pathTo', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no mapping', (t) => {
  const mapping = null
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should return data when no fields', (t) => {
  const mapping = {}
  const data = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]
  const expected = data

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})
