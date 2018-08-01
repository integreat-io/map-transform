import test from 'ava'

import * as mapTransform from '..'

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

test('should not map fields without paths', (t) => {
  const def = {
    mapping: {
      title: null,
      author: 'meta.writer.username'
    }
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
