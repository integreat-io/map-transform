import test from 'ava'
import value from './value'
import { get } from './getSet'
import transform from './transform'

import mutate from './mutate'

// Setup

const data = [
  { headline: 'Entry 1', user: 'johnf' },
  { headline: 'Entry 2', user: 'lucyk' },
]

const stateWithObject = {
  root: { data },
  context: data[0],
  value: data[0],
}

const stateWithArray = {
  root: { data },
  context: data,
  value: data,
}

const threeLetters = (value: unknown) =>
  typeof value === 'string' ? value.substr(0, 3) : value

const options = {}

// Tests

test('should mutate shallow object with map functions', (t) => {
  const def = {
    id: value('ent1'),
    title: get('headline'),
    text: value('The text'),
    age: get('unknown'),
  }
  const expected = {
    root: { data },
    context: data[0],
    value: {
      id: 'ent1',
      title: 'Entry 1',
      text: 'The text',
      age: undefined,
    },
  }

  const ret = mutate(def)(options)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should mutate object with map functions', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text'),
        age: get('unknown'),
      },
      relationships: {
        author: get('user'),
      },
    },
  }
  const expectedValue = {
    item: {
      id: 'ent1',
      attributes: {
        title: 'Entry 1',
        text: 'The text',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
      },
    },
  }

  const ret = mutate(def)(options)(stateWithObject)

  t.deepEqual(ret.value, expectedValue)
})

test('should mutate object with props in the given order', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text'),
        age: get('unknown'),
      },
      relationships: {
        author: get('user'),
      },
    },
  }
  const expectedPropsItem = ['id', 'attributes', 'relationships']
  const expectedPropsAttrs = ['title', 'text', 'age']
  const expectedPropsRels = ['author']

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ret = mutate(def)(options)(stateWithObject) as any

  const item = ret.value.item
  t.deepEqual(Object.keys(item), expectedPropsItem)
  t.deepEqual(Object.keys(item.attributes), expectedPropsAttrs)
  t.deepEqual(Object.keys(item.relationships), expectedPropsRels)
})

test('should iterate when $iterate is true', (t) => {
  const def = {
    $iterate: true,
    title: get('headline'),
  }
  const expectedValue = [{ title: 'Entry 1' }, { title: 'Entry 2' }]

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not iterate when $iterate is false', (t) => {
  const def = {
    $iterate: false,
    title: get('headline'),
  }
  const expectedValue = {
    title: ['Entry 1', 'Entry 2'],
  }

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should honor $iterate on sub objects', (t) => {
  const def = {
    articles: {
      $iterate: true,
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate sub objects on brackets notation paths', (t) => {
  const def = {
    'articles[]': {
      title: get('headline'),
    },
  }
  const expectedValue = {
    articles: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
  }

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should iterate pipelines on brackets notation paths', (t) => {
  const def = {
    'articles[]': ['headline'],
  }
  const expectedValue = {
    articles: ['Entry 1', 'Entry 2'],
  }

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not iterate sub pipeline on brackets notation paths', (t) => {
  const def = {
    'articles[]': [
      {
        title: get('headline'),
      },
    ],
  }
  const expectedValue = {
    articles: [{ title: ['Entry 1', 'Entry 2'] }],
  }

  const ret = mutate(def)(options)(stateWithArray)

  t.deepEqual(ret.value, expectedValue)
})

test('should not mutate undefined value', (t) => {
  const def = {
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    root: { data },
    context: data[0],
    value: undefined,
  }
  const expected = state

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should not mutate undefined value in array', (t) => {
  const def = {
    $iterate: true,
    id: value('ent1'),
    title: get('headline'),
  }
  const state = {
    root: { data },
    context: data,
    value: [undefined],
  }
  const expected = state

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when no map functions', (t) => {
  const def = {}
  const state = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: { headline: 'The title' },
  }
  const expected = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: undefined,
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const def = {
    content: {
      title: 'headline',
    },
  }
  const state = {
    root: {},
    context: {},
    value: { headline: 'The title' },
  }
  const expectedValue = {
    content: {
      title: 'The title',
    },
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should treat array as map pipe', (t) => {
  const def = {
    item: {
      attributes: {
        title: ['data', 'headline'],
      },
    },
  }
  const state = {
    root: {},
    context: {},
    value: { data: { headline: 'The title' } },
  }
  const expectedValue = {
    item: {
      attributes: {
        title: 'The title',
      },
    },
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map', (t) => {
  const def = {
    content: {
      title: 'headline',
    },
  }
  const state = {
    root: {},
    context: {},
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expectedValue = { headline: 'The title' }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with value array', (t) => {
  const data = {
    data: {
      items: [{ title: 'Entry 1' }, { title: 'Entry 2' }],
    },
  }
  const def = {
    data: {
      'items[]': {
        title: get('headline'),
      },
    },
  }
  const state = {
    root: data,
    context: data,
    value: data,
    rev: true,
  }
  const expectedValue = [{ headline: 'Entry 1' }, { headline: 'Entry 2' }]

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should flip and mutate object', (t) => {
  const def = {
    $flip: true,
    item: {
      id: value('ent1'),
      attributes: {
        title: ['headline', transform(threeLetters)],
        age: ['unknown'],
      },
      relationships: {
        author: 'user',
      },
    },
  }
  const expectedValue = {
    item: {
      id: 'ent1',
      attributes: {
        title: 'Ent',
        age: undefined,
      },
      relationships: {
        author: 'johnf',
      },
    },
  }

  const ret = mutate(def)(options)({ ...stateWithObject, rev: true })

  t.deepEqual(ret.value, expectedValue)
})

test('should skip transform object wlith $direction: rev going forward', (t) => {
  const def = {
    $direction: 'rev',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = mutate(def)(options)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: rev in reverse', (t) => {
  const def = {
    $direction: 'rev',
    content: {
      title: 'headline',
    },
  }
  const state = {
    root: {},
    context: {},
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expectedValue = { headline: 'The title' }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should skip transform object with $direction: fwd in reverse', (t) => {
  const def = {
    $direction: 'fwd',
    content: {
      title: 'headline',
    },
  }
  const state = {
    root: {},
    context: {},
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expected = state

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should transform object with $direction: fwd going forward', (t) => {
  const def = {
    $direction: 'fwd',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = {
    root: { data },
    context: data[0],
    value: {
      id: 'ent1',
      title: 'Entry 1',
    },
  }

  const ret = mutate(def)(options)(stateWithObject)

  t.deepEqual(ret, expected)
})

test('should use forward alias', (t) => {
  const optionsWithAlias = { ...options, fwdAlias: 'from' }
  const def = {
    $direction: 'from',
    content: {
      title: 'headline',
    },
  }
  const state = {
    root: {},
    context: {},
    value: {
      content: {
        title: 'The title',
      },
    },
    rev: true,
  }
  const expected = state

  const ret = mutate(def)(optionsWithAlias)(state)

  t.deepEqual(ret, expected)
})

test('should use reverse alias', (t) => {
  const optionsWithAlias = { ...options, revAlias: 'to' }
  const def = {
    $direction: 'to',
    id: value('ent1'),
    title: get('headline'),
  }
  const expected = stateWithObject

  const ret = mutate(def)(optionsWithAlias)(stateWithObject)

  t.deepEqual(ret, expected)
})
