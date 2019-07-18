import test from 'ava'

import pathGetter from './pathGetter'

// Helpers

const object = {
  data: {
    items: [
      { id: 'item1', title: 'First item', tags: ['one', 'odd'], active: true },
      { id: 'item2', title: 'Second item', tags: ['two', 'even'], active: false },
      { id: 'item3', title: 'Third, but not last', tags: ['three', 'odd'] },
      { id: 'item4', title: 'Fourth and last', tags: ['four', 'even'], active: true }
    ]
  },
  meta: {
    author: 'Someone',
    tags: []
  },
  list: [{ id: 'no1' }, { id: 'no2' }, { id: 'no3' }],
  images: null
}

// Tests

test('should get value at path', (t) => {
  const path = 'meta.author'

  const ret = pathGetter(path)(object)

  t.is(ret, 'Someone')
})

test('should ensure array when path ends with square brackets', (t) => {
  const path = 'meta.author[]'

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, ['Someone'])
})

test('should ensure array when path includes square brackets', (t) => {
  const path = 'data.items[].id'

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, ['item1', 'item2', 'item3', 'item4'])
})

test('should ensure array when value is undefined', (t) => {
  const path = 'meta.author[]'

  const ret = pathGetter(path)({})

  t.deepEqual(ret, [])
})

test('should return empty array when value is null', (t) => {
  const path = 'images[]'

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, [])
})

test('should get value at path with array index', (t) => {
  const path = 'data.items[0]'

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, object.data.items[0])
})

test('should get value at path with array index in the middle', (t) => {
  const path = 'data.items[0].title'

  const ret = pathGetter(path)(object)

  t.is(ret, 'First item')
})

test('should get array of values at path with open array', (t) => {
  const path = 'data.items[].title'
  const expected = [
    'First item',
    'Second item',
    'Third, but not last',
    'Fourth and last'
  ]

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, expected)
})

test('should flatten arrays', (t) => {
  const path = 'data.items[].tags[]'
  const expected = [
    'one',
    'odd',
    'two',
    'even',
    'three',
    'odd',
    'four',
    'even'
  ]

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, expected)
})

test('should return object when no path', (t) => {
  const path = null

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, object)
})

test('should return object when empty path', (t) => {
  const path = ''

  const ret = pathGetter(path)(object)

  t.deepEqual(ret, object)
})

test('should return undefined when object is null', (t) => {
  const path = 'meta.author'

  const ret = pathGetter(path)(null)

  t.is(ret, undefined)
})

test('should return undefined when path is not found', (t) => {
  const path = 'meta.author'

  const ret = pathGetter(path)({})

  t.is(ret, undefined)
})
