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

export interface Context {
  rev: boolean
  onlyMappedValues: boolean
}

export interface DataMapper {
  (data: unknown, context: Context): any
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

export type OperationObject =
  | TransformObject
  | FilterObject
  | ApplyObject
  | AltObject

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
  $apply?: undefined
  $alt?: undefined
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
