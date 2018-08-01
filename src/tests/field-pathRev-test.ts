import test from 'ava'

import * as mapTransform from '..'

test('should reverse map simple object', (t) => {
  const def = {
    mapping: {
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

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map array of objects', (t) => {
  const def = {
    mapping: {
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

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with array path', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer[0].username'
    }
  }
  const data = {
    title: 'The heading',
    author: 'johnf'
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: [{ username: 'johnf' }] }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
