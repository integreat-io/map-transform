import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from './is.js'
import type { Dictionary, State, Options } from '../types.js'

import { prepareOptions, preparePipelines } from './prepareOptions.js'

// Tests -- prepareOptions

test('should set default values for minimal incoming options', () => {
  const options = {}

  const ret = prepareOptions(options)

  assert.ok(ret)
  assert.equal(isObject(ret.transformers), true)
  assert.equal(isObject(ret.pipelines), true)
  assert.equal(isObject(ret.dictionaries), true)
  assert.deepEqual(ret.nonvalues, [undefined])
  assert.equal(ret.fwdAlias, undefined)
  assert.equal(ret.revAlias, undefined)
  assert.equal(ret.modifyOperationObject, undefined)
  assert.equal(ret.modifyGetValue, undefined)
})

test('should include internal transformers in the internal options', () => {
  const options = {}

  const ret = prepareOptions(options)

  assert.equal(typeof ret.transformers?.flatten, 'function')
  assert.equal(typeof ret.transformers?.map, 'function')
  assert.equal(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
})

test('should include provided transformers in the internal options', () => {
  const customTrans1 = () => () => async () => {
    return
  }
  const customTrans2 = () => () => async () => {
    return
  }

  const options = {
    transformers: {
      custom1: customTrans1,
      custom2: customTrans2,
    },
  }

  const ret = prepareOptions(options)

  assert.equal(ret.transformers?.custom1, customTrans1)
  assert.equal(ret.transformers?.custom2, customTrans2)
  assert.equal(typeof ret.transformers?.map, 'function')
  assert.equal(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
  assert.notEqual(ret.transformers, options.transformers) // Make sure we have created a new object
})

test('should include transformers with symbol key', () => {
  const customTrans1 = () => () => async () => {
    return
  }
  const customTrans2 = () => () => async () => {
    return
  }
  const symbol1 = Symbol.for('customTrans1')

  const options = {
    transformers: {
      [symbol1]: customTrans1,
      custom2: customTrans2,
    },
  }

  const ret = prepareOptions(options)

  assert.equal(ret.transformers?.[symbol1], customTrans1) // eslint-disable-line security/detect-object-injection
  assert.equal(ret.transformers?.custom2, customTrans2)
  assert.equal(typeof ret.transformers?.map, 'function')
  assert.equal(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
})

test('should override internal transform with incoming', () => {
  const customFlatten = () => () => async () => {
    return
  }

  const options = {
    transformers: {
      flatten: customFlatten, // Should override built-in
    },
  }

  const ret = prepareOptions(options)

  assert.equal(ret.transformers?.flatten, customFlatten) // Is overridden
})

test('should pass on incoming pipelines', () => {
  const customPipeline = ['data', { $transform: 'fixEverything' }]
  const options = {
    pipelines: {
      customPath: 'path.to.something',
      customPipeline,
    },
  }

  const ret = prepareOptions(options)

  assert.equal(ret.pipelines?.customPath, 'path.to.something')
  assert.equal(ret.pipelines?.customPipeline, customPipeline)
  assert.notEqual(ret.pipelines, options.pipelines) // Make sure we have created a new object
})

test('should pass on incoming dictionaries', () => {
  const dict1: Dictionary = [
    ['1', true],
    ['0', false],
  ]
  const dict2: Dictionary = [
    ['active', true],
    ['*', false],
  ]
  const options = {
    dictionaries: { dict1, dict2 },
  }

  const ret = prepareOptions(options)

  assert.equal(ret.dictionaries?.dict1, dict1)
  assert.equal(ret.dictionaries?.dict2, dict2)
  assert.notEqual(ret.dictionaries, options.dictionaries) // Make sure we have created a new object
})

test('should use incoming nonvalue', () => {
  const options = {
    nonvalues: ['empty', null],
  }

  const ret = prepareOptions(options)

  assert.deepEqual(ret.nonvalues, ['empty', null])
})

test('should pass on other incoming options', () => {
  const options = {
    fwdAlias: 'from',
    revAlias: 'to',
    modifyOperationObject: () => ({}),
    modifyGetValue: () => undefined,
  }

  const ret = prepareOptions(options)

  assert.ok(ret)
  assert.equal(ret.fwdAlias, 'from')
  assert.equal(ret.revAlias, 'to')
  assert.equal(ret.modifyOperationObject, options.modifyOperationObject)
  assert.equal(ret.modifyGetValue, options.modifyGetValue)
})

// Tests -- preparePipelines

test('preparePipelines should include only needed pipelines and resolve it to an operation', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe1')
  neededPipelineIds.add('pipe3')
  neededPipelineIds.add(Symbol.for('pipe4'))
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1: () => () => async (state: State) => state,
        pipe2: () => () => async (state: State) => state,
        pipe3: ['some', 'pipeline', { $transform: 'not' }],
        [Symbol.for('pipe4')]: () => () => async (state: State) => state,
        [Symbol.for('pipe5')]: ['unused', 'pipeline'],
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }
  const originalPipelines = options.pipelines

  preparePipelines(options)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assert.deepEqual(Reflect.ownKeys(options.pipelines!), [
    'pipe1',
    'pipe3',
    Symbol.for('pipe4'),
  ])
  assert.equal(typeof options.pipelines?.pipe1, 'function')
  assert.equal(typeof options.pipelines?.pipe3, 'function')
  assert.equal(typeof options.pipelines?.[Symbol.for('pipe4')], 'function')
  assert.equal(options.pipelines, originalPipelines)
})

test('preparePipelines should also resolve pipelines applied by a pipeline', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe1')
  neededPipelineIds.add('pipe3')
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1: () => () => async (state: State) => state,
        pipe2: () => () => async (state: State) => state,
        pipe3: ['some', 'pipeline', { $apply: 'pipe2' }],
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }

  preparePipelines(options)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assert.deepEqual(Reflect.ownKeys(options.pipelines!), [
    'pipe1',
    'pipe2',
    'pipe3',
  ])
  assert.equal(typeof options.pipelines?.pipe1, 'function')
  assert.equal(typeof options.pipelines?.pipe2, 'function')
  assert.equal(typeof options.pipelines?.pipe3, 'function')
})

test('preparePipelines should also resolve pipelines applied by a pipeline in a pipeline', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe3')
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1: () => () => async (state: State) => state,
        pipe2: ['sub', 'pipeline', { $apply: 'pipe1' }],
        pipe3: ['some', 'pipeline', { $apply: 'pipe2' }],
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }

  preparePipelines(options)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assert.deepEqual(Reflect.ownKeys(options.pipelines!), [
    'pipe1',
    'pipe2',
    'pipe3',
  ])
  assert.equal(typeof options.pipelines?.pipe1, 'function')
  assert.equal(typeof options.pipelines?.pipe2, 'function')
  assert.equal(typeof options.pipelines?.pipe3, 'function')
})

test('preparePipelines should not be tripped by recurring pipelines', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe3')
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1: () => () => async (state: State) => state,
        pipe2: ['sub', 'pipeline', { $apply: 'pipe2' }],
        pipe3: ['some', 'pipeline', { $apply: 'pipe2' }],
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }

  preparePipelines(options)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  assert.deepEqual(Reflect.ownKeys(options.pipelines!), ['pipe2', 'pipe3'])
  assert.notEqual(typeof options.pipelines?.pipe1, 'function')
  assert.equal(typeof options.pipelines?.pipe2, 'function')
  assert.equal(typeof options.pipelines?.pipe3, 'function')
})
