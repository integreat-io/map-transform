import test from 'node:test'
import assert from 'node:assert/strict'
import type { Transformer } from './typesNext.js'

import prepareOptions, { getBookKeeping } from './prepareOptions.js'

// Setup

const upperCase: Transformer = () => () => (value) =>
  typeof value === 'string' ? value.toUpperCase() : value

// Tests

test('should return a copy of the options', () => {
  const pipelines = { entry: ['title'] }
  const options = { pipelines }

  const ret = prepareOptions(options)

  assert.notEqual(ret, options)
  assert.equal(ret.pipelines, pipelines) // Passed on by reference
})

test('should not modify the options it is given', () => {
  const options = { pipelines: { entry: ['title'] } }
  const expected = { pipelines: { entry: ['title'] } }

  prepareOptions(options)

  assert.deepEqual(options, expected)
  assert.equal(getBookKeeping(options), undefined)
})

test('should include the built-in transformers for both variants', () => {
  const options = { transformers: { upperCase } }

  const ret = prepareOptions(options)
  const book = getBookKeeping(ret)

  assert.equal(book?.sync.transformers.upperCase, upperCase)
  assert.equal(book?.async.transformers.upperCase, upperCase)
  assert.equal(typeof book?.sync.transformers.compare, 'function')
  assert.equal(typeof book?.async.transformers.compare, 'function')
  assert.notEqual(
    book?.sync.transformers.compare,
    book?.async.transformers.compare,
  )
})

test('should let custom transformers override the built-in ones', () => {
  const options = { transformers: { compare: upperCase } }

  const ret = prepareOptions(options)
  const book = getBookKeeping(ret)

  assert.equal(book?.sync.transformers.compare, upperCase)
  assert.equal(book?.async.transformers.compare, upperCase)
})

test('should give each variant its own pipelines map', () => {
  const options = { pipelines: { entry: ['title'] } }

  const ret = prepareOptions(options)
  const book = getBookKeeping(ret)

  assert.equal(book?.sync.pipelines.size, 0)
  assert.equal(book?.async.pipelines.size, 0)
  assert.notEqual(book?.sync.pipelines, book?.async.pipelines)
})

test('should return already prepared options as they are', () => {
  const options = { pipelines: { entry: ['title'] } }
  const prepared = prepareOptions(options)

  const ret = prepareOptions(prepared)

  assert.equal(ret, prepared)
  assert.equal(getBookKeeping(ret), getBookKeeping(prepared))
})

test('should not expose the book-keeping as an enumerable prop', () => {
  const options = { pipelines: { entry: ['title'] } }
  const expected = ['pipelines']

  const ret = prepareOptions(options)

  assert.deepEqual(Object.keys(ret), expected)
  assert.deepEqual(Object.getOwnPropertySymbols({ ...ret }), [])
})
