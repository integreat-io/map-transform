import {
  Operation,
  State,
  MapObject,
  Options,
  MapDefinition,
  MapPipe,
  Path
} from '../types'
import { setStateValue } from '../utils/stateHelpers'
import merge from './merge'
import { set } from './getSet'
import { divide } from './directionals'
import plug from './plug'
import iterate from './iterate'
import { isMapObject } from '../utils/definitionHelpers'

const ensureArray = (value: any) => (Array.isArray(value) ? value : [value])

const shouldIterate = (def: MapDefinition, path: Path) =>
  (isMapObject(def) && def['$iterate'] === true) || path.includes('[]')

const createSubPipeline = (
  pipeline: MapDefinition | undefined | boolean,
  path: Path
) =>
  isMapObject(pipeline)
    ? [objectToMapFunction(pipeline, path)]
    : ensureArray(pipeline)

const extractRealPath = (path: Path) => {
  const [realPath, index] = path.split('/')
  return [realPath, typeof index !== 'undefined'] as const
}

const mergeAndIterate = (
  pipelines: MapDefinition[],
  def: MapDefinition,
  path: Path
) =>
  shouldIterate(def, path) ? iterate(merge(...pipelines)) : merge(...pipelines)

const objectToMapFunction = (objectDef: MapObject, path = ''): Operation =>
  mergeAndIterate(
    Object.entries(objectDef)
      .map(([path, def]) => {
        if (!def || typeof def === 'boolean') {
          return null
        }
        const [realPath, revOnly] = extractRealPath(path)
        const pipeline = [
          ...createSubPipeline(def, realPath),
          set(realPath)
        ] as MapPipe
        return revOnly ? divide(plug(), pipeline) : pipeline
      })
      .filter(Boolean),
    objectDef,
    path
  )

export default function mutate(def: MapObject): Operation {
  if (Object.keys(def).length === 0) {
    return (_options: Options) => (state: State) =>
      setStateValue(state, undefined)
  }
  const runMutation = objectToMapFunction(def)

  return (options: Options) => (state: State): State =>
    typeof state.value === 'undefined' ? state : runMutation(options)(state)
}
