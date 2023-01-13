import test from 'ava'
import pipe from './pipe.js'
import { identity } from '../utils/functional.js'

import { get, set } from './getSet.js'

// Setup

const stateFromValue = (value: unknown, rev = false) => ({
  context: [],
  value,
  rev,
})

const options = {}

// Tests -- get

test('should return simple get function', (t) => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = { ...state, context: [{ name: 'Bohm' }], value: 'Bohm' }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get dot path', (t) => {
  const path = 'data.scientist.name'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should split up path with array index', (t) => {
  const path = 'data.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get path with several array indeces', (t) => {
  const path = 'data[0].scientists[1].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get array index as root', (t) => {
  const path = '[1].name'
  const value = [{ name: 'Bohr' }, { name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should handle array notation in path', (t) => {
  const path = 'data.scientists[].names.last'
  const value = {
    data: {
      scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
    },
  }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohr', 'Bohm'],
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return a flattened array', (t) => {
  const path = 'data[].scientists[].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohr', 'Bohm'],
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not touch escaped brackets', (t) => {
  const path = 'data.scientists\\[].name'
  const value = { data: { 'scientists[]': { name: 'Bohr' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohr',
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should force array', (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohm'],
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined when object is null', (t) => {
  const path = 'name'
  const value = null
  const state = stateFromValue(value)
  const expected = { ...state, context: [null], value: undefined }

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array with null when value is null and expecting array', (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: null } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [null],
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is empty', (t) => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is dot', (t) => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should disregard spaces in path', (t) => {
  const path = ' data.scientists [1]. name '
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined when path does not match data', (t) => {
  const path = 'data.unknown.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array when path does not match, but expecting array', (t) => {
  const path = 'data.unknown.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [],
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array for missing array', (t) => {
  const path = 'articles[]'
  const value = {}
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [{}],
    value: [],
  }

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- get path with parent

test('should get path with parent', (t) => {
  const path = '^.meta.field'
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' }, meta: { field: 'physics' } },
      },
      { scientist: { name: 'Bohm' }, meta: { field: 'physics' } },
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 'physics'

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents', (t) => {
  const path = '^.^.page'
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with parents from array index', (t) => {
  const path = '^.^.^.^.page'
  const state = {
    context: [
      {
        data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }],
        page: 0,
      },
      [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }],
      { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] },
      [{ name: 'Bohr' }, { name: 'Bohm' }],
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get from parent outside array', (t) => {
  const path = '^.field'
  const state = {
    context: [
      {
        data: {
          scientists: [{ name: 'Bohr' }, { name: 'Bohm' }],
          field: 'physics',
        },
      },
      {
        scientists: [{ name: 'Bohr' }, { name: 'Bohm' }],
        field: 'physics',
      },
    ],
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }
  const expectedValue = 'physics'

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with parent from array', (t) => {
  const path = '^[0].field' // TODO: Should we be able to fetch from parent without specifying index?
  const state = {
    context: [
      {
        data: [
          {
            scientists: [{ name: 'Bohr' }, { name: 'Bohm' }],
            field: 'physics',
          },
        ],
      },
      [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }], field: 'physics' }],
    ],
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }
  const expectedValue = 'physics'

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents from array', (t) => {
  const path = '^.^.page'
  const state = {
    context: [
      {
        data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }],
        page: 0,
      },
      [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }],
    ],
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }

  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- get path with root

test('should get path with root from context', (t) => {
  const path = '^^.page'
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with root from value', (t) => {
  const path = '^^.meta.page'
  const value = {
    data: { scientist: { name: 'Bohm' } },
    meta: { page: 0 },
  }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 0,
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get path with root without dot', (t) => {
  const path = '^^page'
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should support obsolete root notation with one carret', (t) => {
  const path = '^page'
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value: { name: 'Bohm' },
  }
  const expectedValue = 0

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get root when value is root', (t) => {
  const path = '^^page'
  const value = {
    data: { scientist: { name: 'Bohm' } },
    page: 0,
  }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 0,
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should clear context when getting root', (t) => {
  const path = '^^'
  const value = { scientist: { name: 'Bohm' } }
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
    ],
    value,
  }
  const expected = {
    ...state,
    context: [],
    value: {
      data: { scientist: { name: 'Bohm' } },
      page: 0,
    },
  }

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set

test('should set with simple path', (t) => {
  const path = 'name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = set(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set with dot path', (t) => {
  const path = 'data.scientist.name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientist: { name: 'Bohm' } } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array index', (t) => {
  const path = 'data.scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientists: [undefined, { name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set path with several array indeces', (t) => {
  const path = 'data[0].scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: [{ scientists: [undefined, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat path prefixed by > as set', (t) => {
  const path = '>name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = get(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set array index as root', (t) => {
  const path = '[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [undefined, { name: 'Bohm' }],
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should iterate array at array notation', (t) => {
  const path = 'data.scientists[].names.last'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: {
      data: {
        scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
      },
    },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should iterate array at array notation with target', (t) => {
  const path = 'data.scientists[].names.last'
  const value = ['Bohr', 'Bohm']
  const state = {
    ...stateFromValue(value),
    target: {
      data: {
        scientists: [{ id: 1 }, { id: 2 }],
      },
    },
  }
  const expected = {
    ...state,
    value: {
      data: {
        scientists: [
          { id: 1, names: { last: 'Bohr' } },
          { id: 2, names: { last: 'Bohm' } },
        ],
      },
    },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set simple path in root array', (t) => {
  const path = '[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set array for path without array notation', (t) => {
  const path = 'data.scientists'
  const value = [{ name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientists: [{ name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array notation in reverse', (t) => {
  const path = 'data.scientists[].names.last'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: {
      data: {
        scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
      },
    },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not set on sub target', (t) => {
  const path = 'meta.user'
  const state = {
    context: [],
    target: { id: 'ent1' },
    value: 'johnf',
  }
  const expected = {
    ...state,
    value: { id: 'ent1', meta: { user: 'johnf' } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array notation when flipping', (t) => {
  const path = 'data.scientists[].names.last'
  const value = ['Bohr', 'Bohm']
  const state = { ...stateFromValue(value), flip: true }
  const expected = {
    ...state,
    value: {
      data: {
        scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
      },
    },
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not set with when both rev and flipping', (t) => {
  const path = 'data.scientists[].names.last'
  const value = {
    data: {
      scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
    },
  }
  const state = { ...stateFromValue(value, true), flip: true }
  const expectedValue = ['Bohr', 'Bohm']

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set path with several arrays', (t) => {
  const path = 'data[].scientists[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set with escaped brackets', (t) => {
  const path = 'data.scientists\\[].name'
  const value = 'Bohr'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { 'scientists[]': { name: 'Bohr' } } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is empty - for set', (t) => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is dot - for set', (t) => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set null value', (t) => {
  const path = 'scientists[].name'
  const value = null
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { scientists: [{ name: null }] },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not set when parent path -- for now', (t) => {
  const path = '^.meta.field'
  const value = 'physics'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not set with root path -- for now', (t) => {
  const path = '^^.page'
  const value = 0
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set with target

test('should set on target', (t) => {
  const path = 'name'
  const value = 'Bohm'
  const state = {
    ...stateFromValue(value),
    target: { id: 1 },
  }
  const expected = {
    ...state,
    value: { id: 1, name: 'Bohm' },
  }

  const fn = set(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set on target with depth', (t) => {
  const path = 'data.personal.name'
  const value = 'Bohm'
  const state = {
    ...stateFromValue(value),
    target: { data: { personal: { id: 1 } } },
  }
  const expected = {
    ...state,
    value: { data: { personal: { id: 1, name: 'Bohm' } } },
  }

  const fn = pipe(set(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set array index on target', (t) => {
  const path = '[1]'
  const value = 'Bohm'
  const state = {
    ...stateFromValue(value),
    target: ['Bohr'],
  }
  const expected = {
    ...state,
    value: ['Bohr', 'Bohm'],
  }

  const fn = set(path)[0]
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set in reverse

test('should set on path in reverse', (t) => {
  const path = 'data.personal.name'
  const value = 'Bohm'
  const state = {
    ...stateFromValue(value, true),
    target: {
      data: { personal: { id: 1 } },
    },
  }
  const expected = {
    ...state,
    value: { data: { personal: { id: 1, name: 'Bohm' } } },
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set on array path in reverse', (t) => {
  const path = 'data[].personal.name'
  const value = 'Bohm'
  const state = {
    ...stateFromValue(value, true),
    target: {
      data: { personal: { id: 1 } },
    },
  }
  const expected = {
    ...state,
    value: { data: [{ personal: { id: 1, name: 'Bohm' } }] },
  }

  const fn = pipe(get(path))
  const ret = fn(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test.todo('should not strip away star')
// const state = {
//   context: [],
//   value: 's3cr3t',
// }
// const expectedValue = { 's:header': { '*tu:api-key': 's3cr3t' } }

test.todo('should not set undefined when onlyMapped is true')
