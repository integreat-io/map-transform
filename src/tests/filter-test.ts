import test from 'ava'
import { FilterFunction } from '../..'

import mapTransform from '../lib'

// Helpers

const noHeading: FilterFunction = (item: {title: string}) =>
  !(/heading/gi).test(item.title)

const noAlso: FilterFunction = (item: {title: string}) =>
  !(/also/gi).test(item.title)

// Tests

test('should filter out item', (t) => {
  const mapping = {
    fields: {
      title: 'content.heading'
    },
    filter: noHeading
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = null

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should filter out items in array', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should filter with array of filters', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should keep all when filter is empty array', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should filter on reverse mapping', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})

test('should set filtered items on pathTo', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping)(data)

  t.deepEqual(ret, expected)
})

test('should filter items from pathTo for reverse mapping', (t) => {
  const mapping = {
    fields: {
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

  const ret = mapTransform(mapping).rev(data)

  t.deepEqual(ret, expected)
})
