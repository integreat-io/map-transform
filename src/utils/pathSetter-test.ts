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

test('should return value when no path', (t) => {
  const path = ''
  const object = {}
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, 'johnf')
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

test('should set value at array index path with existing object', (t) => {
  const path = 'meta.authors[0].id'
  const object = {
    meta: {
      authors: [{ type: 'author' }]
    }
  }
  const expected = {
    meta: {
      authors: [{ id: 'johnf', type: 'author' }]
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should preserve existing array when setting on new index path', (t) => {
  const path = 'meta.authors[1].id'
  const object = {
    meta: {
      authors: [{ id: 'lucyk' }]
    }
  }
  const expected = {
    meta: {
      authors: [{ id: 'lucyk' }, { id: 'johnf' }]
    }
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should preserve existing array and set index path on existing object', (t) => {
  const path = 'meta.authors[1].id'
  const object = {
    meta: {
      authors: [{ id: 'lucyk', type: 'author' }, { type: 'author' }]
    }
  }
  const expected = {
    meta: {
      authors: [{ id: 'lucyk', type: 'author' }, { id: 'johnf', type: 'author' }]
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

test('should set array at path with array', (t) => {
  const path = 'meta.authors[]'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf', 'maryk']
    }
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set array at path with only array brackets', (t) => {
  const path = '[]'
  const expected = ['johnf', 'maryk']
  const ret = pathSetter(path)(['johnf', 'maryk'], null)

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

test('should preserve props on existing object', (t) => {
  const path = 'meta.author'
  const object = {
    content: [{ id: 'ent1' }]
  }
  const expected = {
    meta: {
      author: 'johnf'
    },
    content: [{ id: 'ent1' }]
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})
