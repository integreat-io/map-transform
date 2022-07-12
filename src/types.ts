/* eslint-disable @typescript-eslint/no-explicit-any */

export type Path = string

export type DictionaryValue = string | number | boolean | null | undefined

export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]

export interface Dictionaries {
  [key: string]: Dictionary
}

export interface ValueFunction {
  (): any
}

export interface Operands {
  [key: string]: any | ValueFunction
}

export interface DataMapper {
  (data: unknown, state: State): any
}

export interface CustomFunction<T = Operands> {
  (operands: T, options: Options): DataMapper
}

export interface State {
  root: unknown
  context: unknown
  target?: unknown
  value: unknown
  rev?: boolean
  onlyMapped?: boolean
  arr?: boolean
}

export interface Options {
  functions?: {
    [key: string]: CustomFunction
  }
  pipelines?: {
    [key: string]: MapDefinition
  }
  dictionaries?: Dictionaries
  mutateNull?: boolean
  fwdAlias?: string
  revAlias?: string
}

export interface TransformObject extends Operands {
  $transform: string
  $iterate?: boolean
  $direction?: string
}

export interface FilterObject extends Operands {
  $filter: string
  $direction?: string
}

export interface IfObject extends Operands {
  $if: string | MapDefinition
  $direction?: string
}

export interface ApplyObject extends Operands {
  $apply: string
  $iterate?: boolean
  $direction?: string
}

export interface AltObject extends Operands {
  $alt: string
  $iterate?: boolean
  $direction?: string
}

export interface ValueObject extends Operands {
  $value: string
  $iterate?: boolean
  $direction?: string
}

export interface AndObject extends Operands {
  $and: MapDefinition[]
}

export interface OrObject extends Operands {
  $or: MapDefinition[]
}

export type OperationObject =
  | TransformObject
  | FilterObject
  | IfObject
  | ApplyObject
  | AltObject
  | ValueObject
  | AndObject
  | OrObject

export interface StateMapper {
  (state: State): State
  getTarget?: (state: State) => unknown
}

export interface Operation {
  (options: Options): StateMapper
}

export interface MapFunction {
  (options: Options): (state: State) => State
}

export type MapPipeSimple = (MapObject | Operation | OperationObject | Path)[]

export type MapPipe = (
  | MapObject
  | Operation
  | OperationObject
  | Path
  | MapPipeSimple
)[]

export interface MapObject {
  [key: string]: MapDefinition | undefined | boolean
  $iterate?: boolean
  $modify?: boolean | Path
  $flip?: boolean
  $transform?: undefined
  $filter?: undefined
  $if?: undefined
  $apply?: undefined
  $valud?: undefined
  $alt?: undefined
  $and?: undefined
  $or?: undefined
}

export type MapDefinition =
  | MapObject
  | Operation
  | OperationObject
  | MapPipe
  | Path
  | null

export interface MapTransformWithOnlyMappedValues {
  (data: unknown): any
  onlyMappedValues: (data: unknown) => any
}

export interface MapTransform extends MapTransformWithOnlyMappedValues {
  rev: MapTransformWithOnlyMappedValues
}
