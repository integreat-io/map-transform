import test from 'ava'
import sinon from 'sinon'

import preparePipeline from './index.js'

// Setup

const castFn = (value: unknown) => String(value) // The implementation doesn't matter
const logicalFn = () => true // The implementation doesn't matter
const mergeFn = (value: unknown) => value // The implementation doesn't matter

// Tests

test('should change $and to $transform', (t) => {
  const logicalStub = sinon.stub().callsFake(() => () => logicalFn)
  const def = { $and: ['this', 'that'] }
  const options = { transformers: { logical: logicalStub } }
  const expectedPipeline = [
    {
      type: 'transform',
      fn: logicalFn,
    },
  ]
  const expectedProps = {
    operator: 'AND',
    path: ['this', 'that'],
  }

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expectedPipeline)
  t.is(logicalStub.callCount, 1)
  t.deepEqual(logicalStub.args[0][0], expectedProps)
})

test('should change $or to $transform', (t) => {
  const logicalStub = sinon.stub().callsFake(() => () => logicalFn)
  const def = { $or: ['this', 'that'] }
  const options = { transformers: { logical: logicalStub } }
  const expectedPipeline = [
    {
      type: 'transform',
      fn: logicalFn,
    },
  ]
  const expectedProps = {
    path: ['this', 'that'],
    operator: 'OR',
  }

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expectedPipeline)
  t.is(logicalStub.callCount, 1)
  t.deepEqual(logicalStub.args[0][0], expectedProps)
})

test('should change $merge to $transform', (t) => {
  const mergeStub = sinon.stub().callsFake(() => () => mergeFn)
  const def = { $merge: ['this', 'that'] }
  const options = { transformers: { merge: mergeStub } }
  const expectedPipeline = [
    {
      type: 'transform',
      fn: mergeFn,
    },
  ]
  const expectedProps = {
    path: ['this', 'that'],
  }

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expectedPipeline)
  t.is(mergeStub.callCount, 1)
  t.deepEqual(mergeStub.args[0][0], expectedProps)
})

test('should apply modifyOperationObject to operation', (t) => {
  const modifyOperationObject = (op: Record<string, unknown>) =>
    op.$cast ? { $transform: `cast_${op.$cast}` } : op
  const def = { $cast: 'string' }
  const options = {
    modifyOperationObject,
    transformers: { cast_string: () => () => castFn },
  }
  const expected = [{ type: 'transform', fn: castFn }]

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expected)
})

test('should apply modifyOperationObject to before built-in modify', (t) => {
  const logicalStub = sinon.stub().callsFake(() => () => logicalFn)
  const modifyOperationObject = (op: Record<string, unknown>) =>
    op.$every ? { $and: op.$every } : op
  const def = { $every: ['this', 'that'] }
  const options = {
    modifyOperationObject,
    transformers: { logical: logicalStub },
  }
  const expectedPipeline = [{ type: 'transform', fn: logicalFn }]
  const expectedProps = {
    operator: 'AND',
    path: ['this', 'that'],
  }

  const ret = preparePipeline(def, options)

  t.deepEqual(ret, expectedPipeline)
  t.is(logicalStub.callCount, 1)
  t.deepEqual(logicalStub.args[0][0], expectedProps)
})
