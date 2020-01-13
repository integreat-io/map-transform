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

const ensureArray = (value: unknown) => (Array.isArray(value) ? value : [value])

const setIfPath = (map: unknown) => (typeof map === 'string' ? set(map) : map)

const flipIfNeeded = (pipe: MapPipe, flip: boolean) => {
  const pipeline = flip
    ? pipe
        .slice()
        .reverse()
        .map(setIfPath)
    : pipe
  return pipeline
}

const shouldIterate = (def: MapDefinition, path: Path) =>
  (isMapObject(def) && def['$iterate'] === true) || path.includes('[]')

const createSubPipeline = (
  pipeline: MapDefinition | undefined | boolean,
  flip: boolean,
  path: Path
) =>
  isMapObject(pipeline)
    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
      [objectToMapFunction(pipeline, flip, path)]
    : flipIfNeeded(ensureArray(pipeline), flip)

const extractRealPath = (path: Path) => {
  const [realPath, index] = path.split('/')
  return [realPath, index !== undefined] as const
}

const mergeAndIterate = (
  pipelines: MapDefinition[],
  def: MapDefinition,
  path: Path
) =>
  shouldIterate(def, path) ? iterate(merge(...pipelines)) : merge(...pipelines)

const objectToMapFunction = (
  objectDef: MapObject,
  flip: boolean,
  path = ''
): Operation =>
  mergeAndIterate(
    Object.entries(objectDef)
      .map(([path, def]) => {
        if (!def || typeof def === 'boolean') {
          return null
        }
        const [realPath, revOnly] = extractRealPath(path)
        const pipeline = [
          flip ? realPath : null,
          ...createSubPipeline(def, flip, realPath),
          flip ? null : set(realPath)
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
  const flip = def.$flip || false
  const runMutation = objectToMapFunction(def, flip)

  return (options: Options) => (state: State): State =>
    state.value === undefined ? state : runMutation(options)(state)
}
