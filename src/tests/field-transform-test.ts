import test from 'ava'
import { TransformFunction } from '../utils/transformPipeline'

import * as mapTransform from '..'

// Helpers

const appendEllipsis: TransformFunction = (str: string) => str + ' ...'
appendEllipsis.rev = (str: string) =>
  (str.endsWith(' ...')) ? str.substr(0, str.length - 4) : str
const upperCase: TransformFunction = (str: string) => str.toUpperCase()
const getLength: TransformFunction = (str: string) => str.length
const enclose: TransformFunction = (str: string) => `(${str})`
enclose.rev = (str: string) => (str.startsWith('(') && str.endsWith(')'))
  ? str.substr(1, str.length - 2) : str

// Tests

test('should map field with one transform function', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: appendEllipsis
      }
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    title: 'The heading ...'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should map field with array of transform functions', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: [ appendEllipsis, upperCase ]
      }
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    title: 'THE HEADING ...'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should apply transform functions from left to right', (t) => {
  const def = {
    mapping: {
      titleLength: {
        path: 'content.heading',
        transform: [ appendEllipsis, getLength ]
      }
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    titleLength: 15
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should not fail with empty transform array', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: []
      }
    }
  }
  const data = {
    content: { heading: 'The heading' }
  }
  const expected = {
    title: 'The heading'
  }

  const ret = mapTransform(def)(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with transform functions from transformRev', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: [ upperCase ],
        transformRev: [ getLength, appendEllipsis ]
      }
    }
  }
  const data = {
    title: 'The heading'
  }
  const expected = {
    content: { heading: '11 ...' }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with transform function from rev props', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: appendEllipsis
      }
    }
  }
  const data = {
    title: 'The heading ...'
  }
  const expected = {
    content: { heading: 'The heading' }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})

test('should reverse map with several transform functions from rev props', (t) => {
  const def = {
    mapping: {
      title: {
        path: 'content.heading',
        transform: [ appendEllipsis, upperCase, enclose ]
      }
    }
  }
  const data = {
    title: '(The heading ...)'
  }
  const expected = {
    content: { heading: 'The heading' }
  }

  const ret = mapTransform(def).rev(data)

  t.deepEqual(ret, expected)
})
