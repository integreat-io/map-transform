import test from 'ava'

import { mapTransform, transform, rev, TransformFunction, Data } from '..'

// Helpers

const isObject = (item: Data): item is object => (!!item && typeof item === 'object')

const createTitle = (item: { title: string, author: string }) => `${item.title} - by ${item.author}`
const removeAuthor = (item: { title: string, author: string }) => (item.title.endsWith(` - by ${item.author}`))
  ? item.title.substr(0, item.title.length - 6 - item.author.length)
  : item.title

const appendAuthorToTitle: TransformFunction = (item) => (isObject(item))
    ? { ...item, title: createTitle(item as any) }
    : item

const removeAuthorFromTitle: TransformFunction = (item) => (isObject(item))
  ? ({ ...item, title: removeAuthor(item as any) })
  : item

const setActive: TransformFunction = (item) => (isObject(item))
  ? { ...item, active: true }
  : item

const prepareAuthorName = ({ author }: { author: string }) =>
  `${author[0].toUpperCase()}${author.substr(1)}.`

const setAuthorName: TransformFunction = (item) => (isObject(item))
  ? ({ ...item, authorName: prepareAuthorName(item as any) })
  : item

const appendEllipsis: TransformFunction = (str) => (typeof str === 'string') ? str + ' ...' : str

const getLength: TransformFunction = (str) => (typeof str === 'string') ? str.length : 0

// Tests

test('should map simple object with one transform function', (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform(appendAuthorToTitle)
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map simple object with several transform functions', (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform(appendAuthorToTitle),
    transform(setActive)
  ]
  const data = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }
  const expected = {
    title: 'The heading - by johnf',
    author: 'johnf',
    active: true
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should reverse map simple object with rev transform', (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username',
      authorName: 'meta.writer.name'
    },
    rev(transform(setAuthorName))
  ]
  const data = {
    title: 'The heading',
    author: 'johnf'
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf', name: 'Johnf.' } }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map simple object with dedicated rev transform', (t) => {
  const def = [
    {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform(appendAuthorToTitle, removeAuthorFromTitle)
  ]
  const data = {
    title: 'The heading - by johnf',
    author: 'johnf'
  }
  const expected = {
    content: { heading: 'The heading' },
    meta: { writer: { username: 'johnf' } }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should transform beofre data is set on outer path', (t) => {
  const def = {
    attributes: [
      'result.data',
      {
        title: 'content.heading',
        author: 'meta.writer.username'
      },
      transform(appendAuthorToTitle)
    ]
  }
  const data = {
    result: {
      data: {
        content: { heading: 'The heading' },
        meta: { writer: { username: 'johnf' } }
      }
    }
  }
  const expected = {
    attributes: {
      title: 'The heading - by johnf',
      author: 'johnf'
    }
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should transform before mapping', (t) => {
  const def = [
    transform(setActive),
    {
      title: 'content.heading',
      enabled: 'active'
    }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    title: 'The heading',
    enabled: true
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply transform functions from left to right', (t) => {
  const def = [
    {
      titleLength: [
        'content.heading',
        transform(appendEllipsis),
        transform(getLength)
      ]
    }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    titleLength: 15
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})
