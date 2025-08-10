import test from 'node:test'
import assert from 'node:assert/strict'
import pipe from './pipe.js'
import { noopNext } from '../utils/stateHelpers.js'
import { isObject } from '../utils/is.js'
import { State, Options } from '../types.js'

import { get, set } from './getSet.js'

// Setup

const stateFromValue = (value: unknown, rev = false, noDefaults = false) => ({
  context: [],
  value,
  rev,
  noDefaults,
})

const options = {}

// Tests -- get

test('should return simple get function', async () => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = { ...state, context: [{ name: 'Bohm' }], value: 'Bohm' }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should get dot path', async () => {
  const path = 'data.scientist.name'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should split up path with array index', async () => {
  const path = 'data.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should split up path with negative array index', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should get path with several array indeces', async () => {
  const path = 'data[0].scientists[1].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should get with array index as first part', async () => {
  const path = '[1].name'
  const value = [{ name: 'Bohr' }, { name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should handle array notation in path', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should return a flattened array', async () => {
  const path = 'data[].scientists[].name'
  const value = { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohr', 'Bohm'],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not get from $modify', async () => {
  const path = 'data.scientist.$modify'
  const value = { data: { scientist: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not touch escaped brackets', async () => {
  const path = 'data.scientists\\[].name'
  const value = { data: { 'scientists[]': { name: 'Bohr' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohr',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should force array', async () => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: ['Bohm'],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should get path starting with escaped $', async () => {
  const path = '\\$type'
  const value = { id: '1', $type: 'scientist', name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'scientist',
  }

  const fn = pipe(get(path)) // Note: `get()` returns an array and needs to be run through pipe
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when object is null', async () => {
  const path = 'name'
  const value = null
  const state = stateFromValue(value)
  const expected = { ...state, context: [null], value: undefined }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return empty array with null when value is null and expecting array', async () => {
  const path = 'data.scientists[].name'
  const value = { data: { scientists: { name: null } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [null],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return value when path is empty', async () => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return value when path is dot', async () => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should disregard spaces in path', async () => {
  const path = ' data.scientists [1]. name '
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: 'Bohm',
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return undefined when path does not match data', async () => {
  const path = 'data.unknown.scientists[1].name'
  const value = { data: { scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return empty array when path does not match, but expecting array', async () => {
  const path = 'data.unknown.scientists[].name'
  const value = { data: { scientists: { name: 'Bohm' } } }
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [],
  }

  const fn = pipe(get(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return empty array for missing array', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should return array with null by default', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should return empty array when value is null and null is a nonvalue', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should not return empty array when noDefaults is true', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should clear untouched flag when getting', async () => {
  const path = 'name'
  const value = { name: 'Bohm' }
  const state = { ...stateFromValue(value) }
  const stateWithUntouched = { ...state, untouched: true }
  const expected = { ...state, context: [{ name: 'Bohm' }], value: 'Bohm' }

  const fn = get(path)[0] // Note: `get()` returns an array, but we'll run the first operation directly as there will be only one
  const ret = await fn(options)(noopNext)(stateWithUntouched)

  assert.deepEqual(ret, expected)
})

// Tests -- get path with parent

test('should get path with parent', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get path with parents from array index', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get from parent outside array', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get path with parent from array', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get path with several parents from array', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

// Tests -- get path with root

test('should get path with root from context', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get path with root from value', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should get path with root without dot', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should support obsolete root notation with one carret', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should get root when value is root', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should clear context when getting root', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should apply modifyGetValue to value from get', async () => {
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

  assert.deepEqual(ret, expected)
})

// Tests -- set

test('should set with simple path', async () => {
  const path = 'name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set with dot path', async () => {
  const path = 'data.scientist.name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientist: { name: 'Bohm' } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set undefined on path', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set empty object on path', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set path with array index', async () => {
  const path = 'data.scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    // eslint-disable-next-line no-sparse-arrays
    value: { data: { scientists: [, { name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set path with several array indeces', async () => {
  const path = 'data[0].scientists[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    // eslint-disable-next-line no-sparse-arrays
    value: { data: [{ scientists: [, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should treat path prefixed by > as set', async () => {
  const path = '>name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  const expected = { ...state, context: [], value: { name: 'Bohm' } }

  const fn = get(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set array index as root', async () => {
  const path = '[1].name'
  const value = 'Bohm'
  const state = stateFromValue(value)
  // eslint-disable-next-line no-sparse-arrays
  const expected = { ...state, value: [, { name: 'Bohm' }] }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should iterate array at array notation', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should iterate array at array notation with target', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set simple path in root array', async () => {
  const path = '[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: [{ name: 'Bohr' }, { name: 'Bohm' }],
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set array for path without array notation', async () => {
  const path = 'data.scientists'
  const value = [{ name: 'Bohm' }]
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { scientists: [{ name: 'Bohm' }] } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set path with array notation in reverse', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should not set on sub target', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set path with array notation when flipping', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should not set with when both rev and flipping', async () => {
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

  assert.deepEqual(ret.value, expectedValue)
})

test('should set path with several arrays', async () => {
  const path = 'data[].scientists[].name'
  const value = ['Bohr', 'Bohm']
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: [{ scientists: [{ name: 'Bohr' }, { name: 'Bohm' }] }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set with escaped brackets', async () => {
  const path = 'data.scientists\\[].name'
  const value = 'Bohr'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { data: { 'scientists[]': { name: 'Bohr' } } },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not strip away star', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set with escaped $', async () => {
  const path = '\\$type'
  const value = 'scientist'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { $type: 'scientist' },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set undefined when state.noDefaults is true', async () => {
  const path = 'name'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set nonvalue when state.noDefaults is true and bracket notation', async () => {
  const path = 'name[]'
  const value = undefined
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set null when state.noDefaults is true and null is in nonvalues', async () => {
  const options = { nonvalues: [null, undefined] }
  const path = 'name'
  const value = null
  const state = stateFromValue(value, false, true) // noDefaults = true
  const expected = { ...state, context: [], value: undefined }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set undefined on a target when state.noDefaults is true', async () => {
  const path = 'name'
  const value = undefined
  const state = {
    ...stateFromValue(value, false, true), // noDefaults = true
    target: { id: 'johnf' },
  }
  const expected = { ...state, context: [], value: { id: 'johnf' } }

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return value when path is empty - for set', async () => {
  const path = ''
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should return value when path is dot - for set', async () => {
  const path = '.'
  const value = { name: 'Bohm' }
  const state = stateFromValue(value)
  const expected = state

  const fn = set(path)[0]
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should set null value', async () => {
  const path = 'scientists[].name'
  const value = null
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: { scientists: [{ name: null }] },
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set when parent path -- for now', async () => {
  const path = '^.meta.field'
  const value = 'physics'
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

test('should not set with root path -- for now', async () => {
  const path = '^^.page'
  const value = 0
  const state = stateFromValue(value)
  const expected = {
    ...state,
    value: undefined,
  }

  const fn = pipe(set(path))
  const ret = await fn(options)(noopNext)(state)

  assert.deepEqual(ret, expected)
})

// Tests -- set with target

test('should set on target', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set on target with depth', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set array index on target', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should merge with target', async () => {
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

  assert.deepEqual(ret, expected)
})

// Tests -- set in reverse

test('should set on path in reverse', async () => {
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

  assert.deepEqual(ret, expected)
})

test('should set on array path in reverse', async () => {
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

  assert.deepEqual(ret, expected)
})
