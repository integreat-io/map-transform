import test from 'ava'
import { isObject } from './is.js'
import type { Dictionary, State, Options } from '../types.js'

import { prepareOptions, preparePipelines } from './prepareOptions.js'

// Tests -- prepareOptions

test('should set default values for minimal incoming options', (t) => {
  const options = {}

  const ret = prepareOptions(options)

  t.truthy(ret)
  t.true(isObject(ret.transformers))
  t.true(isObject(ret.pipelines))
  t.true(isObject(ret.dictionaries))
  t.deepEqual(ret.nonvalues, [undefined])
  t.is(ret.fwdAlias, undefined)
  t.is(ret.revAlias, undefined)
  t.is(ret.modifyOperationObject, undefined)
  t.is(ret.modifyGetValue, undefined)
})

test('should include internal transformers in the internal options', (t) => {
  const options = {}

  const ret = prepareOptions(options)

  t.is(typeof ret.transformers?.flatten, 'function')
  t.is(typeof ret.transformers?.map, 'function')
  t.is(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
})

test('should include provided transformers in the internal options', (t) => {
  const customTrans1 = () => () => async () => {}
  const customTrans2 = () => () => async () => {}

  const options = {
    transformers: {
      custom1: customTrans1,
      custom2: customTrans2,
    },
  }

  const ret = prepareOptions(options)

  t.is(ret.transformers?.custom1, customTrans1)
  t.is(ret.transformers?.custom2, customTrans2)
  t.is(typeof ret.transformers?.map, 'function')
  t.is(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
  t.not(ret.transformers, options.transformers) // Make sure we have created a new object
})

test('should include transformers with symbol key', (t) => {
  const customTrans1 = () => () => async () => {}
  const customTrans2 = () => () => async () => {}
  const symbol1 = Symbol.for('customTrans1')

  const options = {
    transformers: {
      [symbol1]: customTrans1,
      custom2: customTrans2,
    },
  }

  const ret = prepareOptions(options)

  t.is(ret.transformers?.[symbol1], customTrans1) // eslint-disable-line security/detect-object-injection
  t.is(ret.transformers?.custom2, customTrans2)
  t.is(typeof ret.transformers?.map, 'function')
  t.is(typeof ret.transformers?.value, 'function') // We're just checking for a few of these
})

test('should override internal transform with incoming', (t) => {
  const customFlatten = () => () => async () => {}

  const options = {
    transformers: {
      flatten: customFlatten, // Should override built-in
    },
  }

  const ret = prepareOptions(options)

  t.is(ret.transformers?.flatten, customFlatten) // Is overridden
})

test('should pass on incoming pipelines', (t) => {
  const customPipeline = ['data', { $transform: 'fixEverything' }]
  const options = {
    pipelines: {
      customPath: 'path.to.something',
      customPipeline,
    },
  }

  const ret = prepareOptions(options)

  t.is(ret.pipelines?.customPath, 'path.to.something')
  t.is(ret.pipelines?.customPipeline, customPipeline)
  t.not(ret.pipelines, options.pipelines) // Make sure we have created a new object
})

test('should pass on incoming dictionaries', (t) => {
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

  t.is(ret.dictionaries?.dict1, dict1)
  t.is(ret.dictionaries?.dict2, dict2)
  t.not(ret.dictionaries, options.dictionaries) // Make sure we have created a new object
})

test('should use incoming nonvalue', (t) => {
  const options = {
    nonvalues: ['empty', null],
  }

  const ret = prepareOptions(options)

  t.deepEqual(ret.nonvalues, ['empty', null])
})

test('should pass on other incoming options', (t) => {
  const options = {
    fwdAlias: 'from',
    revAlias: 'to',
    modifyOperationObject: () => ({}),
    modifyGetValue: () => undefined,
  }

  const ret = prepareOptions(options)

  t.truthy(ret)
  t.is(ret.fwdAlias, 'from')
  t.is(ret.revAlias, 'to')
  t.is(ret.modifyOperationObject, options.modifyOperationObject)
  t.is(ret.modifyGetValue, options.modifyGetValue)
})

// Tests -- preparePipelines

test('preparePipelines should include only needed pipelines and resolve it to an operation', (t) => {
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

  t.deepEqual(Reflect.ownKeys(options.pipelines!), [
    'pipe1',
    'pipe3',
    Symbol.for('pipe4'),
  ])
  t.is(typeof options.pipelines?.pipe1, 'function')
  t.is(typeof options.pipelines?.pipe3, 'function')
  t.is(typeof options.pipelines?.[Symbol.for('pipe4')], 'function')
  t.is(options.pipelines, originalPipelines)
})

test('preparePipelines should also resolve pipelines applied by a pipeline', (t) => {
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

  t.deepEqual(Reflect.ownKeys(options.pipelines!), ['pipe1', 'pipe2', 'pipe3'])
  t.is(typeof options.pipelines?.pipe1, 'function')
  t.is(typeof options.pipelines?.pipe2, 'function')
  t.is(typeof options.pipelines?.pipe3, 'function')
})

test('preparePipelines should also resolve pipelines applied by a pipeline in a pipeline', (t) => {
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

  t.deepEqual(Reflect.ownKeys(options.pipelines!), ['pipe1', 'pipe2', 'pipe3'])
  t.is(typeof options.pipelines?.pipe1, 'function')
  t.is(typeof options.pipelines?.pipe2, 'function')
  t.is(typeof options.pipelines?.pipe3, 'function')
})

test('preparePipelines should not be tripped by recurring pipelines', (t) => {
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

  t.deepEqual(Reflect.ownKeys(options.pipelines!), ['pipe2', 'pipe3'])
  t.not(typeof options.pipelines?.pipe1, 'function')
  t.is(typeof options.pipelines?.pipe2, 'function')
  t.is(typeof options.pipelines?.pipe3, 'function')
})
