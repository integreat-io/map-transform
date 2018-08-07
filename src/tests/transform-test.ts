import test from 'ava'

import { mapTransform, transform, TransformFunction, Data } from '..'

// Helpers

const isObject = (item: Data): item is object => (!!item && typeof item === 'object')

const createTitle = (item: { title: string, author: string }) => `${item.title} - by ${item.author}`

const appendAuthorToTitle: TransformFunction = (item) => (isObject(item))
    ? { ...item, title: createTitle(item as any) }
    : item

// appendAuthorToTitle.rev = (item: {title: string, author: string}) =>
//   ({
//     ...item,
//     title: (item.title.endsWith(` - by ${item.author}`))
//       ? item.title.substr(0, item.title.length - 6 - item.author.length)
//       : item.title
//   })

const setActive: TransformFunction = (item) => (isObject(item))
  ? { ...item, active: true }
  : item

// setActive.rev = (item: {}) => ({ ...item, active: false })

const setAuthorName: TransformFunction = (item: {author: string}) => ({
  ...item,
  authorName: `${item.author[0].toUpperCase()}${item.author.substr(1)}.`
})

const appendEllipsis: TransformFunction = (str) => (typeof str === 'string') ? str + ' ...' : str
// appendEllipsis.rev = (str: string) =>
//   (str.endsWith(' ...')) ? str.substr(0, str.length - 4) : str
// const upperCase: TransformFunction = (str: string) => str.toUpperCase()
const getLength: TransformFunction = (str) => (typeof str === 'string') ? str.length : 0
// const enclose: TransformFunction = (str: string) => `(${str})`
// enclose.rev = (str: string) => (str.startsWith('(') && str.endsWith(')'))
//   ? str.substr(1, str.length - 2) : str


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

test.skip('should reverse map simple object with transformRev', (t) => {
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

test.skip('should reverse map simple object with transform rev props', (t) => {
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

test.skip('should reverse transform after pathTo and before path', (t) => {
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

test.skip('should transform with array', (t) => {
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

test.skip('should reverse transform with array', (t) => {
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

test.skip('should reverse map with transformFrom function', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    transformFrom: setActive
  }
  const data = {
    title: 'The heading'
  }
  const expected = {
    content: {
      heading: 'The heading'
    },
    active: false
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test.skip('should reverse map with transformFromRev function', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    transformFrom: setActive,
    transformFromRev: setActive
  }
  const data = {
    title: 'The heading'
  }
  const expected = {
    content: {
      heading: 'The heading'
    },
    active: true
  }

  const ret = mapTransform(def).rev(data)

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
