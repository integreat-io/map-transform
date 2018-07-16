import test from 'ava'
import * as deepFreeze from 'deep-freeze'

import pathSetter from './pathSetter'

test('should set value at path', (t) => {
  const path = 'meta.author'
  const object = {}
  const expected = {
    meta: {
      author: 'johnf'
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array index', (t) => {
  const path = 'meta.authors[0]'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf']
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array index larger than 0', (t) => {
  const path = 'meta.authors[2]'
  const object = {}
  const expected = {
    meta: {
      authors: [undefined, undefined, 'johnf']
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array index in the middle', (t) => {
  const path = 'meta.authors[0].id'
  const object = {}
  const expected = {
    meta: {
      authors: [{ id: 'johnf' }]
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value array at path', (t) => {
  const path = 'meta.authors'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf', 'maryk']
    }
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set value array at indexed path', (t) => {
  const path = 'meta.authors[0]'
  const object = {}
  const expected = {
    meta: {
      authors: [['johnf', 'maryk']]
    }
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set value array at path with array', (t) => {
  const path = 'meta.authors[].id'
  const object = {}
  const expected = {
    meta: {
      authors: [{ id: 'johnf' }, { id: 'maryk' }]
    }
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array', (t) => {
  const path = 'meta.authors[]'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf']
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value array at path with indexed array', (t) => {
  const path = 'meta.authors[0].id'
  const object = {}
  const expected = {
    meta: {
      authors: [{ id: ['johnf', 'maryk'] }]
    }
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should preserve untouched values', (t) => {
  const path = 'meta.author'
  const object = deepFreeze({
    meta: {
      author: 'maryk',
      section: 'news'
    },
    content: [{ id: 'ent1' }]
  })
  const expected = {
    meta: {
      author: 'johnf',
      section: 'news'
    },
    content: [{ id: 'ent1' }]
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})
