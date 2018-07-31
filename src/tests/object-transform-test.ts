import test from 'ava'
import { TransformFunction } from '../utils/transformPipeline'

import mapTransform = require('..')

// Helpers

const appendAuthorToTitle: TransformFunction =
  (item: {title: string, author: string}) =>
    ({ ...item, title: `${item.title} - by ${item.author}` })
appendAuthorToTitle.rev = (item: {title: string, author: string}) =>
  ({
    ...item,
    title: (item.title.endsWith(` - by ${item.author}`))
      ? item.title.substr(0, item.title.length - 6 - item.author.length)
      : item.title
  })

const setActive: TransformFunction = (item: {}) =>
  ({ ...item, active: true })
setActive.rev = (item: {}) => ({ ...item, active: false })

const setAuthorName: TransformFunction = (item: {author: string}) => ({
  ...item,
  authorName: `${item.author[0].toUpperCase()}${item.author.substr(1)}.`
})

// Tests

test('should map simple object with one transform function', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform: appendAuthorToTitle
  }
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

test('should map simple object with array of transform functions', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform: [ appendAuthorToTitle, setActive ]
  }
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

test('should reverse map simple object with transformRev', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username',
      authorName: 'meta.writer.name'
    },
    transform: [ appendAuthorToTitle, setActive ],
    transformRev: [ setAuthorName ]
  }
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

test('should reverse map simple object with transform rev props', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform: [ appendAuthorToTitle, setActive ]
  }
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

test('should transform after path and before pathTo', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username'
    },
    transform: appendAuthorToTitle,
    path: 'result.data',
    pathTo: 'attributes'
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

test('should reverse transform after pathTo and before path', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      author: 'meta.writer.username',
      authorName: 'meta.writer.name'
    },
    transform: [ appendAuthorToTitle, setActive ],
    transformRev: [ setAuthorName ],
    path: 'result.data',
    pathTo: 'attributes'
  }
  const data = {
    attributes: {
      title: 'The heading',
      author: 'johnf'
    }
  }
  const expected = {
    result: {
      data: {
        content: { heading: 'The heading' },
        meta: { writer: { username: 'johnf', name: 'Johnf.' } }
      }
    }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should transform with array', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    transform: [ setActive ]
  }
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Another heading' } }
  ]
  const expected = [
    { title: 'The heading', active: true },
    { title: 'Another heading', active: true }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should reverse transform with array', (t) => {
  const def = {
    mapping: {
      title: 'content.heading',
      active: 'content.active'
    },
    transform: [ setActive ]
  }
  const data = [
    { title: 'The heading', active: true },
    { title: 'Another heading', active: true }
  ]
  const expected = [
    { content: { heading: 'The heading', active: false } },
    { content: { heading: 'Another heading', active: false } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
