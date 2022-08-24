import test from 'ava'
import { MapPipe } from '../types'
import { get, set } from './getSet'
import transform from './transform'
import value from './value'
import { identity } from '../utils/functional'

import pipe from './pipe'

// Setup

const state = {
  context: [],
  value: { data: { name: 'John F.' } },
}

const options = {}

const json = (data: unknown) => JSON.stringify(data)

// Tests

test('should run simple map pipe', (t) => {
  const def = ['data', 'name']
  const expected = {
    context: [{ data: { name: 'John F.' } }, { name: 'John F.' }],
    value: 'John F.',
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should allow combination of string path and get operation', (t) => {
  const def = ['data', get('name')]
  const expected = {
    context: [{ data: { name: 'John F.' } }, { name: 'John F.' }],
    value: 'John F.',
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat object as map object', (t) => {
  const def = ['data', { fullName: 'name' }]
  const expectedValue = { fullName: 'John F.' }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should run pipeline in reverse on reverse mapping', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    context: [],
    value: 'John F.',
    rev: true,
  }
  const expected = {
    context: [],
    value: { data: { name: 'John F.' } },
    rev: true,
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should reverse map pipe when flipping', (t) => {
  const def = [get('data'), get('name')]
  const state = {
    context: [],
    value: 'John F.',
    flip: true,
    rev: false,
  }
  const expected = {
    context: [],
    value: { data: { name: 'John F.' } },
    flip: true,
    rev: false,
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should not reverse map when rev and flipping', (t) => {
  const def = ['data', 'name']
  const stateFlipRev = {
    ...state,
    flip: true,
    rev: true,
  }
  const expected = {
    ...stateFlipRev,
    context: [{ data: { name: 'John F.' } }, { name: 'John F.' }],
    value: 'John F.',
  }

  const ret = pipe(def)(options)(identity)(stateFlipRev)

  t.deepEqual(ret, expected)
})

test('should not leak flipping between objects', (t) => {
  const def = [
    { $flip: true, items: 'items' },
    { data: { name: 'items.name' } },
  ]
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
    rev: true,
  }
  const expected = {
    context: [],
    value: { items: { name: 'John F.' } },
    rev: true,
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should set on target', (t) => {
  const def = ['>name', '>data.personal']
  const state = {
    context: [],
    target: { data: { personal: { age: 32 } } },
    value: 'John F.',
    rev: false,
  }
  const expected = {
    ...state,
    value: { data: { personal: { age: 32, name: 'John F.' } } },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get and set on target', (t) => {
  const def = ['user', '>data.personal.name']
  const state = {
    context: [],
    target: { data: { personal: { age: 32 } } },
    value: { user: 'John F.' },
    rev: false,
  }
  const expected = {
    ...state,
    value: { data: { personal: { age: 32, name: 'John F.' } } },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get and set on target with sub pipes', (t) => {
  const def = [pipe(['user']), pipe(['>data.personal.name'])]
  const state = {
    context: [],
    target: { data: { personal: { age: 32 } } },
    value: { user: 'John F.' },
    rev: false,
  }
  const expected = {
    ...state,
    value: { data: { personal: { age: 32, name: 'John F.' } } },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should get and set on target with iteration', (t) => {
  const def = ['data[]', 'nickname', '>name', '>people[]']
  const state = {
    context: [],
    target: undefined,
    value: { data: [{ nickname: 'John F.', age: 32 }] },
    rev: false,
  }
  const expected = {
    ...state,
    value: { people: [{ name: 'John F.' }] },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat target correctly going forward', (t) => {
  const def = [set('name'), set('personal'), transform(json), set('data.user')]
  const state = {
    context: [],
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: 'John F.',
    rev: false,
  }
  const expected = {
    ...state,
    value: {
      data: {
        user: '{"personal":{"age":32,"name":"John F."}}',
        archived: false,
      },
    },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should treat target correctly in reverse', (t) => {
  const def = ['data.user', transform(json), get('personal'), 'name']
  const state = {
    context: ['John F.', ,],
    target: { data: { user: { personal: { age: 32 } }, archived: false } },
    value: 'John F.',
    rev: true,
  }
  const expected = {
    ...state,
    value: {
      data: {
        user: '{"personal":{"age":32,"name":"John F."}}',
        archived: false,
      },
    },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

// TODO: This test was added at some point, but I'm sure what the right behavior really is here
test.skip('should not set undefined on path', (t) => {
  const def = [set('items[]')]
  const state = {
    context: [{ data: { name: 'John F.' } }],
    value: undefined,
  }
  const expectedValue = undefined

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should handle empty pipeline', (t) => {
  const def: MapPipe = []
  const expected = state

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should handle empty pipeline in reverse', (t) => {
  const def: MapPipe = []
  const stateRev = { ...state, rev: true }
  const expected = stateRev

  const ret = pipe(def)(options)(identity)(stateRev)

  t.deepEqual(ret, expected)
})

test('should modify on several levels and with several objects', (t) => {
  const def = [
    {
      $modify: '.',
      payload: {
        $modify: 'payload',
        data: 'payload.data.items[]',
      },
      meta: {
        $modify: 'meta',
        options: {
          $modify: 'meta.options',
          'Content-Type': value('application/json'),
        },
      },
    },
    {
      $modify: '.',
      payload: { $modify: 'payload', 'data.docs[]': ['payload.data'] },
    },
  ]
  const state = {
    context: [],
    value: {
      type: 'DELETE',
      payload: {
        data: { items: [{ id: 'ent1', $type: 'entry' }] },
        service: 'entries',
      },
      meta: {
        ident: { id: 'johnf' },
        options: {
          uri: 'http://api1.test/database/bulk_delete',
        },
      },
    },
  }
  const expectedValue = {
    type: 'DELETE',
    payload: {
      data: { docs: [{ id: 'ent1', $type: 'entry' }] },
      service: 'entries',
    },
    meta: {
      ident: { id: 'johnf' },
      options: {
        uri: 'http://api1.test/database/bulk_delete',
        'Content-Type': 'application/json',
      },
    },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should run complex case forward', (t) => {
  const def = [{ user: ['data', 'name'] }, set('attributes')]
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
  }
  const expected = {
    context: [],
    value: { attributes: { user: 'John F.' } },
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})

test('should run complex case in reverse', (t) => {
  const def = [{ name: ['attributes', 'user'] }, set('data')]
  const state = {
    context: [],
    value: { data: { name: 'John F.' } },
    rev: true,
  }
  const expected = {
    context: [],
    value: { attributes: { user: 'John F.' } },
    rev: true,
  }

  const ret = pipe(def)(options)(identity)(state)

  t.deepEqual(ret, expected)
})
