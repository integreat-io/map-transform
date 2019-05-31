import test from 'ava'
import { Operands } from '../types'

import { mapTransform, transform, rev, Data } from '..'

// Helpers

const isObject = (item: Data): item is object => (!!item && typeof item === 'object')

const createTitle = (item: { title: string, author: string }) => `${item.title} - by ${item.author}`
const removeAuthor = (item: { title: string, author: string }) => (item.title.endsWith(` - by ${item.author}`))
  ? item.title.substr(0, item.title.length - 6 - item.author.length)
  : item.title

const appendToTitle = ({ text }: Operands) => (item: Data) => (isObject(item))
    ? { ...item, title: `${(item as any).title}${text}` }
    : item

const appendAuthorToTitle = (item: Data) => (isObject(item))
    ? { ...item, title: createTitle(item as any) }
    : item

const removeAuthorFromTitle = (item: Data) => (isObject(item))
  ? ({ ...item, title: removeAuthor(item as any) })
  : item

const setActive = (item: Data) => (isObject(item))
  ? { ...item, active: true }
  : item

const prepareAuthorName = ({ author }: { author: string }) =>
  `${author[0].toUpperCase()}${author.substr(1)}.`

const setAuthorName = (item: Data) => (isObject(item))
  ? ({ ...item, authorName: prepareAuthorName(item as any) })
  : item

const appendEllipsis = (str: Data) => (typeof str === 'string') ? str + ' ...' : str

const getLength = () => (str: Data) => (typeof str === 'string') ? str.length : 0

const customFunctions = {
  appendToTitle,
  getLength
}

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
        transform(getLength())
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

test('should apply transform from an operation object', (t) => {
  const def = [
    {
      titleLength: [
        'content.heading',
        { $transform: 'getLength' }
      ]
    }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    titleLength: 11
  }

  const ret = mapTransform(def, { customFunctions })(data)

  t.deepEqual(ret, expected)
})

test('should apply transform from an operation object with arguments', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    { $transform: 'appendToTitle', text: ' - archived' }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    title: 'The heading - archived'
  }

  const ret = mapTransform(def, { customFunctions })(data)

  t.deepEqual(ret, expected)
})

test('should skip unknown customer function', (t) => {
  const def = [
    {
      titleLength: [
        'content.heading',
        { $transform: 'getLength' },
        { $transform: 'unknown' }
      ]
    }
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    titleLength: 11
  }

  const ret = mapTransform(def, { customFunctions })(data)

  t.deepEqual(ret, expected)
})
