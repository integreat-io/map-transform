import test from 'ava'

import { mapTransform, filter, fwd, rev, FilterFunction, Data } from '..'

// Helpers

const isObject = (item: Data): item is object => (!!item && typeof item === 'object')

const noHeadingTitle: FilterFunction = (item) =>
  (isObject(item)) && !(/heading/gi).test((item as any).title)

const noAlso: FilterFunction = (item) => (isObject(item)) && !(/also/gi).test((item as any).title)

// Tests

test('should filter out item', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeadingTitle)
  ]
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeadingTitle)
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } }
  ]
  const expected = [
    { title: 'Just this' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with several filters', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeadingTitle),
    filter(noAlso)
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } }
  ]
  const expected = [
    { title: 'Just this' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on path', (t) => {
  const def = {
    'items[]': [
      {
        title: 'content.heading'
      },
      filter(noHeadingTitle)
    ]
  }
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } }
  ]
  const expected = {
    items: [
      { title: 'Just this' }
    ]
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter items from parent mapping for reverse mapping', (t) => {
  const def = {
    'items[]': [
      {
        title: 'content.heading'
      },
      filter(noHeadingTitle)
    ]
  }
  const data = {
    items: [
      { title: 'The heading' },
      { title: 'Just this' }
    ]
  }
  const expected = [
    { content: { heading: 'Just this' } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeadingTitle),
    filter(noAlso)
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' }
  ]
  const expected = [
    { content: { heading: 'Just this' } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going forward', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle))
  ]
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } },
    { content: { heading: 'Another heading' } },
    { content: { heading: 'Also this' } }
  ]
  const expected = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should use directional filters - going reverse', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    fwd(filter(noAlso)),
    rev(filter(noHeadingTitle))
  ]
  const data = [
    { title: 'The heading' },
    { title: 'Just this' },
    { title: 'Another heading' },
    { title: 'Also this' }
  ]
  const expected = [
    { content: { heading: 'Just this' } },
    { content: { heading: 'Also this' } }
  ]

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should filter before mapping', (t) => {
  const def = [
    'content',
    filter(noHeadingTitle),
    {
      heading: 'title'
    }
  ]
  const data = {
    content: { title: 'The heading' }
  }
  const expected = undefined

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with filter before mapping on reverse mapping', (t) => {
  const def = [
    'content',
    filter(noHeadingTitle),
    {
      heading: 'title'
    }
  ]
  const data = {
    heading: 'The heading'
  }
  const expected = { content: undefined }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
