import { identity } from 'ramda'
import { Operation, StateMapper, DataMapper, Data, MapDefinition, MapObject, Path, MapPipe, OperationObject, Options, CustomFunctions } from '../types'
import { get } from '../funcs/getSet'
import mutate from '../funcs/mutate'
import pipe from '../funcs/pipe'
import transform from '../funcs/transform'
import filter from '../funcs/filter'

const isObject = (def: MapDefinition): def is { [key: string]: any } =>
  typeof def === 'object' && def !== null && !Array.isArray(def)

export const isPath = (def: any): def is Path => typeof def === 'string'
export const isMapObject = (def: any): def is MapObject => isObject(def) && typeof def['$op'] === 'undefined'
export const isMapPipe = (def: any): def is MapPipe => Array.isArray(def)
export const isOperationObject = (def: any): def is OperationObject => isObject(def) && typeof def['$op'] === 'string'
export const isOperation = (def: any): def is Operation => typeof def === 'function'

const getOperationFunction = (fnId?: string, customFunctions?: CustomFunctions) =>
  (fnId && customFunctions && typeof customFunctions[fnId] === 'function')
    ? customFunctions[fnId] : undefined

const operationFromObject = (def: OperationObject, options: Options) => {
  const { $op: op, $fn: fnId, ...operands } = def
  const fn = getOperationFunction(fnId, options.customFunctions)

  switch (op) {
    case 'transform':
      return (fn) ? transform(fn(operands))(options) : identity
    case 'filter':
      return (fn) ? filter(fn(operands) as DataMapper<Data, boolean>)(options) : identity
    default:
      return identity
  }
}

export const mapFunctionFromDef = (def: MapDefinition, options: Options): StateMapper =>
  isMapPipe(def) ? pipe(def)(options)
    : isOperationObject(def) ? operationFromObject(def, options)
    : isMapObject(def) ? mutate(def)(options)
    : isPath(def) ? get(def)(options)
    : isOperation(def) ? def(options)
    : identity
