import test from 'ava'

import { normalizeMapping } from './normalizeMapping'

test('should normalize to mapping objects', (t) => {
  const mapping = {
    title: { path: 'content.heading' },
    author: { path: 'meta.writer.username' }
  }
  const expected = [
    { pathTo: 'title', path: 'content.heading' },
    { pathTo: 'author', path: 'meta.writer.username' }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})

test('should normalize from path shortcut', (t) => {
  const mapping = {
    title: 'content.heading',
    author: 'meta.writer.username'
  }
  const expected = [
    { pathTo: 'title', path: 'content.heading' },
    { pathTo: 'author', path: 'meta.writer.username' }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})

test('should normalize with null as shortcut', (t) => {
  const mapping = {
    title: null
  }
  const expected = [
    { pathTo: 'title', path: null }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})

test('should normalize from object shape', (t) => {
  const mapping = {
    attributes: {
      title: 'content.heading',
      text: 'content.copy',
      deeper: {
        'with.path': 'id'
      }
    },
    relationships: {
      author: 'meta.writer.username'
    }
  }
  const expected = [
    { pathTo: 'attributes.title', path: 'content.heading' },
    { pathTo: 'attributes.text', path: 'content.copy' },
    { pathTo: 'attributes.deeper.with.path', path: 'id' },
    { pathTo: 'relationships.author', path: 'meta.writer.username' }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})

test('should normalize array of mapping objects', (t) => {
  const mapping = [
    { pathTo: 'title', path: 'content.heading' },
    { pathTo: 'author', path: 'meta.writer.username' }
  ]
  const expected = [
    { pathTo: 'title', path: 'content.heading' },
    { pathTo: 'author', path: 'meta.writer.username' }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})

test('should normalize mapping object', (t) => {
  const transform = (value: string) => value + ' norm'
  const transformRev = (value: string) => value + ' rev'
  const mapping = [
    {
      path: '',
      transform,
      transformRev,
      default: 'Untitled',
      defaultRev: 'Titled after all'
    }
  ]
  const expected = [
    {
      pathTo: null,
      path: null,
      transform,
      transformRev,
      default: 'Untitled',
      defaultRev: 'Titled after all'
    }
  ]

  const ret = normalizeMapping(mapping)

  t.deepEqual(ret, expected)
})
