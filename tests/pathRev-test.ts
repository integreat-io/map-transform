import test from 'ava'

import mapTransform from '../lib'

test('should reverse map simple object', (t) => {
  const mapping = {
    fields: {
      title: 'content.heading',
      author: 'meta.writer.username'
    }
  }
  const data = {
    title: 'The heading',
    author: 'johnf'
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map array of objects', (t) => {
  const mapping = {
    fields: {
      title: 'content.heading',
      author: 'meta.writer.username'
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

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})

test('should use defaultRev value', (t) => {
  const mapping = {
    fields: {
      title: {
        path: 'content.heading',
        default: 'Wrong way',
        defaultRev: 'Default heading'
      }
    }
  }
  const data = [
    {},
    { title: 'From data' }
  ]
  const expected = [
    { content: { heading: 'Default heading' } },
    { content: { heading: 'From data' } }
  ]

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})

test('should set missing value to undefined when no defaultRev', (t) => {
  const mapping = {
    fields: {
      title: {
        path: 'content.heading'
      }
    }
  }
  const data = [
    {},
    { title: 'From data' }
  ]
  const expected = [
    { content: { heading: undefined } },
    { content: { heading: 'From data' } }
  ]

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with object path', (t) => {
  const mapping = {
    fields: {
      title: { path: 'content.heading' }
    },
    path: 'content.articles'
  }
  const data = {
    content: {
      articles: [
        { title: 'Heading 1' },
        { title: 'Heading 2' }
      ]
    }
  }
  const expected = [
    { content: { heading: 'Heading 1' } },
    { content: { heading: 'Heading 2' } }
  ]

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})
