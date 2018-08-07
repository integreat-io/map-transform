import test from 'ava'

import { mapTransform, filter, FilterFunction, Data } from '..'

// Helpers

const isObject = (item: Data): item is object => (!!item && typeof item === 'object')

const noHeading: FilterFunction = (item) =>
  (isObject(item)) && !(/heading/gi).test((item as any).title)

const noAlso: FilterFunction = (item) => (isObject(item)) && !(/also/gi).test((item as any).title)

// Tests

test('should filter out item', (t) => {
  const def = [
    {
      title: 'content.heading'
    },
    filter(noHeading)
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
    filter(noHeading)
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
    filter(noHeading),
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
      filter(noHeading)
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

test.skip('should filter items from pathTo for reverse mapping', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: [ noHeading ],
    pathTo: 'items[]'
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

test.skip('should filter on reverse mapping', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: [ noHeading, noAlso ]
  }
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

test.skip('should filter with filterRev on reverse mapping', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: [ noHeading, noAlso ],
    filterRev: [ noHeading ]
  }
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
    filter(noHeading),
    {
      heading: 'title'
    }
  ]
  const data = {
    content: { title: 'The heading' }
  }
  const expected = {
    heading: undefined
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test.skip('should filter with filterFrom on reverse mapping', (t) => {
  const def = {
    mapping: {
      heading: 'title'
    },
    pathFrom: 'content',
    filterFrom: noHeading
  }
  const data = {
    heading: 'The heading'
  }
  const expected = { content: null }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test.skip('should filter with filterFromRev on reverse mapping', (t) => {
  const def = {
    mapping: {
      heading: 'title'
    },
    pathFrom: 'content',
    filterFrom: noHeading,
    filterFromRev: noAlso
  }
  const data = [
    { heading: 'The heading' },
    { heading: 'Also not this' }
  ]
  const expected = {
    content: [{ title: 'The heading' }]
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
