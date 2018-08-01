import test from 'ava'
import { FilterFunction } from '../utils/filterPipeline'

import * as mapTransform from '..'

// Helpers

const noHeading: FilterFunction = (item: {title: string}) =>
  !(/heading/gi).test(item.title)

const noAlso: FilterFunction = (item: {title: string}) =>
  !(/also/gi).test(item.title)

// Tests

test('should filter out item', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: noHeading
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = null

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: noHeading
  }
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

test('should filter with array of filters', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: [ noHeading, noAlso ]
  }
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

test('should keep all when filter is empty array', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: []
  }
  const data = [
    { content: { heading: 'The heading' } },
    { content: { heading: 'Just this' } }
  ]
  const expected = [
    { title: 'The heading' },
    { title: 'Just this' }
  ]

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on pathTo', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filter: noHeading,
    pathTo: 'items[]'
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

test('should filter items from pathTo for reverse mapping', (t) => {
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

test('should filter with filterTo', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filterTo: noHeading
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = null

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', (t) => {
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

test('should filter with filterRev on reverse mapping', (t) => {
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

test('should filter with filterToRev on reverse mapping', (t) => {
  const def = {
    mapping: {
      title: 'content.heading'
    },
    filterTo: [ noHeading, noAlso ],
    filterToRev: [ noHeading ]
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

test('should filter with filterFrom', (t) => {
  const def = {
    mapping: {
      heading: 'title'
    },
    pathFrom: 'content',
    filterFrom: noHeading
  }
  const data = {
    content: { title: 'The heading' }
  }
  const expected = null

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should filter with filterFrom on reverse mapping', (t) => {
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

test('should filter with filterFromRev on reverse mapping', (t) => {
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
