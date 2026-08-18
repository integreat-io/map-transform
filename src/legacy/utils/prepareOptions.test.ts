import test from 'node:test'
import assert from 'node:assert/strict'
import { isObject } from '../../utils/is.js'
import type { Dictionary, State, Options } from '../types.js'

import { prepareOptions, preparePipelines } from './prepareOptions.js'

// Tests -- prepareOptions

test('should set default values for minimal incoming options', () => {
  const options = {}

  const ret = prepareOptions(options)

  assert.ok(ret)
  assert.equal(isObject(ret.transformers), true)
  assert.equal(ret.pipelines, undefined)
  assert.equal(ret.dictionaries, undefined)
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
  assert.equal(ret.pipelines, options.pipelines) // The pipelines object is passed through by reference
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
  assert.equal(ret.dictionaries, options.dictionaries) // The dictionaries object is passed through by reference
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

test('preparePipelines should resolve needed pipelines to operations', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe1')
  neededPipelineIds.add('pipe3')
  neededPipelineIds.add(Symbol.for('pipe4'))
  const unusedPipeline = ['unused', 'pipeline']
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1: () => () => async (state: State) => state,
        pipe2: () => () => async (state: State) => state,
        pipe3: ['some', 'pipeline', { $transform: 'not' }],
        [Symbol.for('pipe4')]: () => () => async (state: State) => state,
        [Symbol.for('pipe5')]: unusedPipeline,
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }
  const originalPipelines = options.pipelines

  preparePipelines(options)

  // Check that prepared pipelines are in the map
  assert.equal(typeof options.preparedPipelines?.get('pipe1'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe3'), 'function')
  assert.equal(
    typeof options.preparedPipelines?.get(Symbol.for('pipe4')),
    'function',
  )
  // Unneeded pipelines are not prepared
  assert.equal(options.preparedPipelines?.has('pipe2'), false)
  assert.equal(options.preparedPipelines?.has(Symbol.for('pipe5')), false)
  // Original pipelines object is unchanged
  assert.equal(options.pipelines, originalPipelines)
  assert.equal(options.pipelines?.[Symbol.for('pipe5')], unusedPipeline)
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

  // Check that prepared pipelines are in the map
  assert.equal(typeof options.preparedPipelines?.get('pipe1'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe2'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe3'), 'function')
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

  // Check that prepared pipelines are in the map
  assert.equal(typeof options.preparedPipelines?.get('pipe1'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe2'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe3'), 'function')
})

test('preparePipelines should not be tripped by recurring pipelines', () => {
  const neededPipelineIds = new Set<string | symbol>()
  neededPipelineIds.add('pipe3')
  const pipe1 = () => () => async (state: State) => state
  const options: Options = {
    ...prepareOptions({
      pipelines: {
        pipe1,
        pipe2: ['sub', 'pipeline', { $apply: 'pipe2' }],
        pipe3: ['some', 'pipeline', { $apply: 'pipe2' }],
      },
    }),
    neededPipelineIds, // NOTE: We add this after we have prepared the options, as it is not preserved to preparation
  }

  preparePipelines(options)

  // Check that prepared pipelines are in the map
  assert.equal(options.preparedPipelines?.get('pipe1'), undefined) // Unneeded pipeline not prepared
  assert.equal(typeof options.preparedPipelines?.get('pipe2'), 'function')
  assert.equal(typeof options.preparedPipelines?.get('pipe3'), 'function')
  // Original pipelines object is unchanged
  assert.equal(options.pipelines?.pipe1, pipe1)
})
