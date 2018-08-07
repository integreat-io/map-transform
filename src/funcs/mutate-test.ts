import test from 'ava'
import value from './value'
import get from './get'

import mutate from './mutate'

test('should mutate object with map functions', (t) => {
  const def = {
    item: {
      id: value('ent1'),
      attributes: {
        title: get('headline'),
        text: value('The text')
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
          text: 'The text'
        },
        relationships: {
          author: 'johnf'
        }
      }
    }
  }

  const ret = mutate(def)(state)

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

  const ret = mutate(def)(state)

  t.deepEqual(ret, expected)
})

test('should treat string as path', (t) => {
  const def = {
    item: {
      attributes: {
        title: 'headline'
      }
    }
  }
  const state = {
    root: {},
    context: {},
    value: { headline: 'The title' }
  }
  const expectedValue = {
    item: {
      attributes: {
        title: 'The title'
      }
    }
  }

  const ret = mutate(def)(state)

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

  const ret = mutate(def)(state)

  t.deepEqual(ret.value, expectedValue)
})
