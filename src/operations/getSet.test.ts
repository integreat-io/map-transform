import test from 'ava'
import pipe from './pipe.js'
import { noopNext } from '../utils/stateHelpers.js'
import { isObject } from '../utils/is.js'
import { State, Options } from '../types.js'

import { get, set, pathGetter, pathSetter } from './getSet.js'

// Setup

const stateFromValue = (value: unknown, rev = false, noDefaults = false) => ({
  context: [],
  value,
  rev,
  noDefaults,
})

const options = {}

// Tests -- get

test('should return simple get function', async (t) => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = { ...state, context: [{ name: 'Bohm' }], value: 'Bohm' }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should get dot path', async (t) => {
  const path = 'data.scientist.name'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should split up path with array index', async (t) => {
  const path = 'data.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should split up path with negative array index', async (t) => {
  const path = 'data.scientists[-1].name'
  const value = {
    data: {
      scientists: [{ name: 'Bohr' }, { name: 'Bohm' }, { name: 'Planck' }],
    },
  }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Planck',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should get path with several array indeces', async (t) => {
  const path = 'data[0].scientists[1].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should get with array index as first part', async (t) => {
  const path = '[1].name'
  const value = [{ name: 'Bohr' }, { name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should handle array notation in path', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return a flattened array', async (t) => {
  const path = 'data[].scientists[].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohr', 'Bohm'],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not get from $modify', async (t) => {
  const path = 'data.scientist.$modify'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not touch escaped brackets', async (t) => {
  const path = 'data.scientists\\[].name'
  const value = { data: { 'scientists[]': { name: 'Bohr' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohr',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should force array', async (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohm'],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should get path starting with escaped $', async (t) => {
  const path = '\\$type'
  const value = { id: '1', $type: 'scientist', name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'scientist',
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined when object is null', async (t) => {
  const path = 'name'
  const value = null
  const state = stateFromValue(value)
  const expected = { ...state, context: [null], value: undefined }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array with null when value is null and expecting array', async (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: null } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [null],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is empty', async (t) => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is dot', async (t) => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should disregard spaces in path', async (t) => {
  const path = ' data.scientists [1]. name '
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return undefined when path does not match data', async (t) => {
  const path = 'data.unknown.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array when path does not match, but expecting array', async (t) => {
  const path = 'data.unknown.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array for missing array', async (t) => {
  const path = 'articles[]'
  const value = {}
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [{}],
    value: [],
  }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return array with null by default', async (t) => {
  const path = 'articles[]'
  const value = { articles: null }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [{ articles: null }],
    value: [null],
  }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return empty array when value is null and null is a nonvalue', async (t) => {
  const options = { nonvalues: [null, undefined] }
  const path = 'articles[]'
  const value = { articles: null }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [{ articles: null }],
    value: [],
  }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not return empty array when noDefaults is true', async (t) => {
  const path = 'articles[]'
  const value = {}
  const state = stateFromValue(value, undefined, true)
  const expected = {
    ...state,
    noDefaults: true,
    context: [{}],
    value: undefined,
  }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should clear untouched flag when getting', async (t) => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = { ...stateFromValue(value) }
  const stateWithUntouched = { ...state, untouched: true }
  const expected = { ...state, context: [{ name: 'Bohm' }], value: 'Bohm' }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = await fn(options)(noopNext)(stateWithUntouched)

  t.deepEqual(ret, expected)
})

// Tests -- get path with parent

test('should get path with parent', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with parents from array index', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get from parent outside array', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with parent from array', async (t) => {
  const path = '^[0].field'
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents from array', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

// Tests -- get path with root

test('should get path with root from context', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get path with root from value', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should get path with root without dot', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should support obsolete root notation with one carret', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should get root when value is root', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should clear context when getting root', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should apply modifyGetValue to value from get', async (t) => {
  const modifyGetValue = (value: unknown, _state: State, _options: Options) =>
    isObject(value) && value.$value ? value.$value : value // A simplified implementation
  const path = 'name'
  const value = { name: { $value: 'Bohm' } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [{ name: { $value: 'Bohm' } }],
    value: 'Bohm',
  }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = await fn({ ...options, modifyGetValue })(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set

test('should set with simple path', async (t) => {
  const path = 'name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set with dot path', async (t) => {
  const path = 'data.scientist.name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientist: { name: 'Bohm' } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set undefined on path', async (t) => {
  const path = 'data.scientist.name'
  const value = undefined
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [],
    value: { data: { scientist: { name: undefined } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set empty object on path', async (t) => {
  const path = 'data.scientist.name'
  const value = {}
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [],
    value: { data: { scientist: { name: {} } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array index', async (t) => {
  const path = 'data.scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientists: [undefined, { name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set path with several array indeces', async (t) => {
  const path = 'data[0].scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: [{ scientists: [undefined, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should treat path prefixed by > as set', async (t) => {
  const path = '>name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set array index as root', async (t) => {
  const path = '[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [undefined, { name: 'Bohm' }],
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should iterate array at array notation', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should iterate array at array notation with target', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set simple path in root array', async (t) => {
  const path = '[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set array for path without array notation', async (t) => {
  const path = 'data.scientists'
  const value = [{ name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientists: [{ name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array notation in reverse', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set on sub target', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set path with array notation when flipping', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set with when both rev and flipping', async (t) => {
  const path = 'data.scientists[].names.last'
  const value = {
    data: {
      scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
    },
  }
  const state = { ...stateFromValue(value, true), flip: true }
  const expectedValue = ['Bohr', 'Bohm']

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should set path with several arrays', async (t) => {
  const path = 'data[].scientists[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set with escaped brackets', async (t) => {
  const path = 'data.scientists\\[].name'
  const value = 'Bohr'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { 'scientists[]': { name: 'Bohr' } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not strip away star', async (t) => {
  const path = 's:header.*tu:api-key'
  const value = 's3cr3t'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    context: [],
    value: { 's:header': { '*tu:api-key': 's3cr3t' } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set with escaped $', async (t) => {
  const path = '\\$type'
  const value = 'scientist'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { $type: 'scientist' },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set undefined when state.noDefaults is true', async (t) => {
  const path = 'name'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set nonvalue when state.noDefaults is true and bracket notation', async (t) => {
  const path = 'name[]'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set null when state.noDefaults is true and null is in nonvalues', async (t) => {
  const options = { nonvalues: [null, undefined] }
  const path = 'name'
  const value = null
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set undefined on a target when state.noDefaults is true', async (t) => {
  const path = 'name'
  const value = undefined
  const state = {
    ...stateFromValue(value, false, true), // noDefaults = true
    target: { id: 'johnf' },
  }
  const expected = { ...state, context: [], value: { id: 'johnf' } }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is empty - for set', async (t) => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should return value when path is dot - for set', async (t) => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set null value', async (t) => {
  const path = 'scientists[].name'
  const value = null
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { scientists: [{ name: null }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set when parent path -- for now', async (t) => {
  const path = '^.meta.field'
  const value = 'physics'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should not set with root path -- for now', async (t) => {
  const path = '^^.page'
  const value = 0
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set with target

test('should set on target', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set on target with depth', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set array index on target', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should merge with target', async (t) => {
  const path = 'data.personal.$modify'
  const value = { id: 'wrong', name: 'Bohm', published: true }
  const state = {
    ...stateFromValue(value),
    target: {
      data: { personal: { id: 1 } },
    },
  }
  const expected = {
    ...state,
    value: { data: { personal: { id: 1, name: 'Bohm', published: true } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- set in reverse

test('should set on path in reverse', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

test('should set on array path in reverse', async (t) => {
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
  const ret = await fn(options)(noopNext)(state)

  t.deepEqual(ret, expected)
})

// Tests -- pathGetter

test('pathGetter should return simple get function', (t) => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should get dot path', (t) => {
  const path = 'data.scientist.name'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should return value when dot path', (t) => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = { name: 'Bohm' }

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get path with array index', (t) => {
  const path = 'data.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get path with negative array index', (t) => {
  const path = 'data.scientists[-1].name'
  const value = {
    data: {
      scientists: [{ name: 'Bohr' }, { name: 'Bohm' }, { name: 'Planck' }],
    },
  }
  const state = stateFromValue(value)
  const expected = 'Planck'

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should return value when no path', (t) => {
  const path = undefined
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = { name: 'Bohm' }

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get path with several array indeces', (t) => {
  const path = 'data[0].scientists[1].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get with array index as first part', (t) => {
  const path = '[1].name'
  const value = [{ name: 'Bohr' }, { name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should handle array notation in path', (t) => {
  const path = 'data.scientists[].names.last'
  const value = {
    data: {
      scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
    },
  }
  const state = stateFromValue(value)
  const expected = ['Bohr', 'Bohm']

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should force array', (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = ['Bohm']

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should return a flattened array', (t) => {
  const path = 'data[].scientists[].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = ['Bohr', 'Bohm']

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get path starting with escaped $', (t) => {
  const path = '\\$type'
  const value = { id: '1', $type: 'scientist', name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = 'scientist'

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should return undefined when object is null', (t) => {
  const path = 'name'
  const value = null
  const state = stateFromValue(value)
  const expected = undefined

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should return empty array with null when value is null and expecting array', (t) => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: null } } }
  const state = stateFromValue(value)
  const expected = [null]

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should return undefined when path does not match data', (t) => {
  const path = 'data.unknown.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = undefined

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should return empty array when path does not match, but expecting array', (t) => {
  const path = 'data.unknown.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected: unknown[] = []

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should return empty array for missing array', (t) => {
  const path = 'articles[]'
  const value = {}
  const state = stateFromValue(value)
  const expected: unknown[] = []

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should get path with parent', (t) => {
  const path = '^.meta.field'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' }, meta: { field: 'physics' } },
      },
      { scientist: { name: 'Bohm' }, meta: { field: 'physics' } },
    ],
    value,
  }
  const expected = 'physics'

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should get path with several parents', (t) => {
  const path = '^.^.page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should get path with parents from array index', (t) => {
  const path = '^.^.^.^.page'
  const value = { name: 'Bohm' }
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
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

test('pathGetter should get path with root from context', (t) => {
  const path = '^^.page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathGetter should support obsolete root notation with one carret', (t) => {
  const path = '^page'
  const value = { name: 'Bohm' }
  const state = {
    context: [
      {
        data: { scientist: { name: 'Bohm' } },
        page: 0,
      },
      { scientist: { name: 'Bohm' } },
    ],
    value,
  }
  const expected = 0

  const ret = pathGetter(path)(value, state)

  t.is(ret, expected)
})

// Tests -- pathSetter

test('pathSetter should set with simple path', (t) => {
  const path = 'name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { name: 'Bohm' }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set with dot path', (t) => {
  const path = 'data.scientist.name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { data: { scientist: { name: 'Bohm' } } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set undefined on path', (t) => {
  const path = 'data.scientist.name'
  const value = undefined
  const state = stateFromValue(value)
  const expected = { data: { scientist: { name: undefined } } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set empty object on path', (t) => {
  const path = 'data.scientist.name'
  const value = {}
  const state = stateFromValue(value)
  const expected = { data: { scientist: { name: {} } } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set path with array index', (t) => {
  const path = 'data.scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { data: { scientists: [undefined, { name: 'Bohm' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set path with several array indeces', (t) => {
  const path = 'data[0].scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { data: [{ scientists: [undefined, { name: 'Bohm' }] }] }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set array index as root', (t) => {
  const path = '[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = [undefined, { name: 'Bohm' }]

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set path with negative array index', (t) => {
  const path = 'data.scientists[-1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { data: { scientists: [{ name: 'Bohm' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should ensure an array where array notation is used', (t) => {
  const path = 'data.scientists[].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { data: { scientists: [{ name: 'Bohm' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should iterate array at array notation', (t) => {
  const path = 'data.scientists[].names.last'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    data: {
      scientists: [{ names: { last: 'Bohr' } }, { names: { last: 'Bohm' } }],
    },
  }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set path with several arrays', (t) => {
  const path = 'data[].scientists[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }],
  }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set array for path without array notation', (t) => {
  const path = 'data.scientists'
  const value = [{ name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = { data: { scientists: [{ name: 'Bohm' }] } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set simple path in root array', (t) => {
  const path = '[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = [{ name: 'Bohr' }, { name: 'Bohm' }]

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set with escaped brackets', (t) => {
  const path = 'data.scientists\\[].name'
  const value = 'Bohr'
  const state = stateFromValue(value)
  const expected = { data: { 'scientists[]': { name: 'Bohr' } } }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set with escaped $', (t) => {
  const path = '\\$type'
  const value = 'scientist'
  const state = stateFromValue(value)
  const expected = { $type: 'scientist' }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should set null value', (t) => {
  const path = 'scientists[].name'
  const value = null
  const state = stateFromValue(value)
  const expected = { scientists: [{ name: null }] }

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should not set undefined when state.noDefaults is true', (t) => {
  const path = 'name'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should not nonvalue when state.noDefaults is true', (t) => {
  const nonvalues = [null, undefined]
  const path = 'name'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = undefined

  const ret = pathSetter(path, { nonvalues })(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should return value for dot path', (t) => {
  const path = '.'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should return value when path is empty string', (t) => {
  const path = ''
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should return value when no path is given', (t) => {
  const path = undefined
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = 'Bohm'

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should not set when parent path', (t) => {
  const path = '^.meta.field'
  const value = 'physics'
  const state = stateFromValue(value)
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})

test('pathSetter should not set with root path', (t) => {
  const path = '^^.page'
  const value = 0
  const state = stateFromValue(value)
  const expected = undefined

  const ret = pathSetter(path)(value, state)

  t.deepEqual(ret, expected)
})
