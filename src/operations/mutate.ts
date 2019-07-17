import mapAny = require('map-any')
import { Operation, State, MapObject, Options, MapDefinition, MapPipe } from '../types'
import { getStateValue, setStateValue } from '../utils/stateHelpers'
import merge from './merge'
import { set } from './getSet'
import { divide } from './directionals'
import plug from './plug'
import { isMapObject } from '../utils/definitionHelpers'

const ensureArray = (value: any) => (Array.isArray(value) ? value : [value])

const createPipeline = (pipeline: MapDefinition | undefined | boolean) =>
  isMapObject(pipeline)
    ? [objectToMapFunction(pipeline)]
    : ensureArray(pipeline)

const objectToMapFunction = (def: MapObject): Operation =>
  merge(
    ...Object.entries(def)
      .map(([path, pipeline]) => {
        if (!pipeline) {
          return null
        }
        const [realPath, index] = path.split('/')
        const next = [...createPipeline(pipeline), set(realPath)] as MapPipe
        return typeof index === 'undefined' ? next : divide(plug(), next)
      })
      .filter(Boolean)
  )

export default function mutate(def: MapObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options: Options) => (state: State) =>
      setStateValue(state, undefined)
  }

  const runMutation = objectToMapFunction(def)
  return (options: Options) => (state: State): State =>
    typeof state.value === 'undefined'
      ? state
      : setStateValue(
          state,
          mapAny(
            value =>
              getStateValue(runMutation(options)(setStateValue(state, value))),
            getStateValue(state)
          )
        )
}
