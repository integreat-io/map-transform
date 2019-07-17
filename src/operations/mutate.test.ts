import test from 'ava'
import value from './value'
import { get } from './getSet'

import mutate from './mutate'

// Setup

const options = {}

// Tests

test('should mutate shallow object with map functions', (t) => {
  const def = {
    id: value('ent1'),
    title: get('headline'),
    text: value('The text'),
    age: get('unknown')
  }
  const state = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: { headline: 'The title' }
  }
  const expected = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: {
      id: 'ent1',
      title: 'The title',
      text: 'The text',
      age: undefined
    }
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should mutate object with map functions', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text'),
        age: get('unknown')
      },
      relationships: {
        author: get('user')
      }
    }
  }
  const state = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: { headline: 'The title', user: 'johnf' }
  }
  const expected = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: {
      item: {
        id: 'ent1',
        attributes: {
          title: 'The title',
          text: 'The text',
          age: undefined
        },
        relationships: {
          author: 'johnf'
        }
      }
    }
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should set value to undefined when no map functions', (t) => {
  const def = {}
  const state = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: { headline: 'The title', user: 'johnf' }
  }
  const expected = {
    root: { data: { headline: 'The title' } },
    context: { headline: 'The title' },
    value: undefined
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const def = {
    content: {
      title: 'headline'
    }
  }
  const state = {
    root: {},
    context: {},
    value: { headline: 'The title' }
  }
  const expectedValue = {
    content: {
      title: 'The title'
    }
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should treat array as map pipe', (t) => {
  const def = {
    item: {
      attributes: {
        title: ['data', 'headline']
      }
    }
  }
  const state = {
    root: {},
    context: {},
    value: { data: { headline: 'The title' } }
  }
  const expectedValue = {
    item: {
      attributes: {
        title: 'The title'
      }
    }
  }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map', (t) => {
  const def = {
    content: {
      title: 'headline'
    }
  }
  const state = {
    root: {},
    context: {},
    value: {
      content: {
        title: 'The title'
      }
    },
    rev: true
  }
  const expectedValue = { headline: 'The title' }

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})

test('should reverse map with value array', (t) => {
  const data = {
    data: {
      items: [
        { title: 'Entry 1' },
        { title: 'Entry 2' }
      ]
    }
  }
  const def = {
    data: {
      items: [
        {
          title: get('headline')
        }
      ]
    }
  }
  const state = {
    root: data,
    context: data,
    value: data,
    rev: true
  }
  const expectedValue = [
    { headline: 'Entry 1' },
    { headline: 'Entry 2' }
  ]

  const ret = mutate(def)(options)(state)

  t.deepEqual(ret.value, expectedValue)
})
