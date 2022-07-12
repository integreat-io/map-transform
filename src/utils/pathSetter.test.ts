import test from 'ava'
import deepFreeze = require('deep-freeze')

import pathSetter from './pathSetter'

// Tests

test('should set value at path', (t) => {
  const path = 'meta.author'
  const object = {}
  const expected = {
    meta: {
      author: 'johnf',
    },
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
      authors: ['johnf'],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array index larger than 0', (t) => {
  const path = 'meta.authors[2]'
  const object = {}
  const expected = {
    meta: {
      authors: [undefined, undefined, 'johnf'],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array index in the middle', (t) => {
  const path = 'meta.authors[0].id'
  const object = {}
  const expected = {
    meta: {
      authors: [{ id: 'johnf' }],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at array index path with existing object', (t) => {
  const path = 'meta.authors[0].id'
  const object = {
    meta: {
      authors: [{ type: 'author' }],
    },
  }
  const expected = {
    meta: {
      authors: [{ id: 'johnf', type: 'author' }],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should preserve existing array when setting on new index path', (t) => {
  const path = 'meta.authors[1].id'
  const object = {
    meta: {
      authors: [{ id: 'lucyk' }],
    },
  }
  const expected = {
    meta: {
      authors: [{ id: 'lucyk' }, { id: 'johnf' }],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should preserve existing array and set index path on existing object', (t) => {
  const path = 'meta.authors[1].id'
  const object = {
    meta: {
      authors: [{ id: 'lucyk', type: 'author' }, { type: 'author' }],
    },
  }
  const expected = {
    meta: {
      authors: [
        { id: 'lucyk', type: 'author' },
        { id: 'johnf', type: 'author' },
      ],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set value at sub array index path', (t) => {
  const path = 'meta[0].authors[0].id'
  const object = {
    meta: [
      {
        authors: [{ type: 'author' }],
      },
    ],
  }
  const expected = {
    meta: [
      {
        authors: [{ id: 'johnf', type: 'author' }],
      },
    ],
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should allow escaped brackets in path', (t) => {
  const path = 'meta.options.created\\[gt]'
  const object = {}
  const expected = {
    meta: {
      options: {
        'created[gt]': new Date('2022-05-01T18:43:11Z'),
      },
    },
  }
  const ret = pathSetter(path)(new Date('2022-05-01T18:43:11Z'), object)

  t.deepEqual(ret, expected)
})

test('should set value array at path', (t) => {
  const path = 'meta.authors'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf', 'maryk'],
    },
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set value array at indexed path', (t) => {
  const path = 'meta.authors[0]'
  const object = {}
  const expected = {
    meta: {
      authors: [['johnf', 'maryk']],
    },
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set value array at path with array', (t) => {
  const path = 'meta.authors[].id'
  const object = {}
  const expected = {
    meta: {
      authors: [{ id: 'johnf' }, { id: 'maryk' }],
    },
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should replace value path with array', (t) => {
  const path = 'content.items[].value'
  const object = {
    content: {
      items: [{ key: 'externalId' }, { key: 'internalId' }],
    },
  }
  const expected = {
    content: {
      items: [
        { key: 'externalId', value: '314' },
        { key: 'internalId', value: '000015' },
      ],
    },
  }
  const ret = pathSetter(path)(['314', '000015'], object)

  t.deepEqual(ret, expected)
})

test('should set object as array', (t) => {
  const path = 'content.data[].createOrMutate'
  const object = {}
  const data = {
    id: 'ent1',
    title: 'The heading',
    views: 42,
  }
  const expected = {
    content: {
      data: [
        {
          createOrMutate: {
            id: 'ent1',
            title: 'The heading',
            views: 42,
          },
        },
      ],
    },
  }
  const ret = pathSetter(path)(data, object)

  t.deepEqual(ret, expected)
})

test('should set value at path with array', (t) => {
  const path = 'meta.authors[]'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf'],
    },
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should set empty array at path when value is undefined', (t) => {
  const path = 'meta.authors[]'
  const object = {}
  const expected = {
    meta: {
      authors: [],
    },
  }
  const ret = pathSetter(path)(undefined, object)

  t.deepEqual(ret, expected)
})

test('should set array at path with array', (t) => {
  const path = 'meta.authors[]'
  const object = {}
  const expected = {
    meta: {
      authors: ['johnf', 'maryk'],
    },
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set array at path with array below another array', (t) => {
  const path = 'articles[].authors[]'
  const object = {}
  const expected = {
    articles: [{ authors: ['johnf'] }, { authors: ['maryk'] }],
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set array at path with array in object below another array', (t) => {
  const path = 'articles[].meta.authors[]'
  const object = {}
  const expected = {
    articles: [
      { meta: { authors: ['johnf'] } },
      { meta: { authors: ['maryk'] } },
    ],
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should set multilevel array at path with array in object below another array', (t) => {
  const path = 'articles[].meta.authors[]'
  const object = {}
  const expected = {
    articles: [{ meta: { authors: ['johnf', 'maryk'] } }],
  }
  const ret = pathSetter(path)([['johnf', 'maryk']], object)

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
      authors: [{ id: ['johnf', 'maryk'] }],
    },
  }
  const ret = pathSetter(path)(['johnf', 'maryk'], object)

  t.deepEqual(ret, expected)
})

test('should preserve untouched values', (t) => {
  const path = 'meta.author'
  const object = deepFreeze({
    meta: {
      author: 'maryk',
      section: 'news',
    },
    content: [{ id: 'ent1' }],
  })
  const expected = {
    meta: {
      author: 'johnf',
      section: 'news',
    },
    content: [{ id: 'ent1' }],
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = pathSetter(path)('johnf', object as any)

  t.deepEqual(ret, expected)
})

test('should preserve props on existing object', (t) => {
  const path = 'meta.author'
  const object = {
    content: [{ id: 'ent1', date: new Date('2021-07-03T13:44:39Z') }],
  }
  const expected = {
    meta: {
      author: 'johnf',
    },
    content: [{ id: 'ent1', date: new Date('2021-07-03T13:44:39Z') }],
  }
  const ret = pathSetter(path)('johnf', object)

  t.deepEqual(ret, expected)
})

test('should preserve props on existing sub object', (t) => {
  const path = 'content[0].title'
  const object = {
    content: [{ id: 'ent1', date: new Date('2021-07-03T13:44:39Z') }],
  }
  const expected = {
    content: [
      { id: 'ent1', date: new Date('2021-07-03T13:44:39Z'), title: 'Entry 1' },
    ],
  }
  const ret = pathSetter(path)('Entry 1', object)

  t.deepEqual(ret, expected)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t.true((ret as any).content[0].date instanceof Date)
})

test('should set object at path', (t) => {
  const value = { id: 'johnf' }
  const path = 'meta.author'
  const object = {}
  const expected = {
    meta: {
      author: { id: 'johnf' },
    },
  }
  const ret = pathSetter(path)(value, object)

  t.deepEqual(ret, expected)
})

test('should replace object at path', (t) => {
  const value = { id: 'johnf' }
  const path = 'meta.author'
  const object = { meta: { author: { id: 'lucyk', roles: ['editor'] } } }
  const expected = {
    meta: {
      author: { id: 'johnf' },
    },
  }
  const ret = pathSetter(path)(value, object)

  t.deepEqual(ret, expected)
})
