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

export type TransformerProps = Record<string, unknown>

export interface DataMapper {
  (data: unknown, state: State): any
}

export interface Transformer<T = TransformerProps> {
  (props: T, options: Options): DataMapper
}

export interface State {
  context: unknown[]
  value: unknown
  target?: unknown
  rev?: boolean
  flip?: boolean
  noDefaults?: boolean
  arr?: boolean
  iterate?: boolean
  index?: number
}

export interface Options {
  transformers?: {
    [key: string]: Transformer
  }
  pipelines?: {
    [key: string]: MapDefinition
  }
  dictionaries?: Dictionaries
  nonvalues?: unknown[]
  fwdAlias?: string
  revAlias?: string
}

export interface TransformObject extends TransformerProps {
  $transform: string
  $iterate?: boolean
  $direction?: string
}

export interface FilterObject extends TransformerProps {
  $filter: string
  $direction?: string
}

export interface IfObject extends TransformerProps {
  $if: MapDefinition
  $direction?: string
  then?: MapDefinition
  else?: MapDefinition
}

export interface ApplyObject extends TransformerProps {
  $apply: string
  $iterate?: boolean
  $direction?: string
}

export interface AltObject extends TransformerProps {
  $alt: MapDefinition[]
  $iterate?: boolean
  $direction?: string
  $undefined?: unknown[]
}

export interface MergeObject extends TransformerProps {
  $merge: unknown
  $iterate?: boolean
  $direction?: string
}

export interface ValueObject extends TransformerProps {
  $value: unknown
  $iterate?: boolean
  $direction?: string
}

export interface AndObject extends TransformerProps {
  $and: MapDefinition[]
}

export interface OrObject extends TransformerProps {
  $or: MapDefinition[]
}

export interface ConcatObject extends TransformerProps {
  $concat: MapDefinition[]
}

export interface LookupObject extends TransformerProps {
  $lookup: Path
  path: Path
}

export type OperationObject =
  | TransformObject
  | FilterObject
  | IfObject
  | ApplyObject
  | AltObject
  | ValueObject
  | MergeObject
  | AndObject
  | OrObject
  | ConcatObject
  | LookupObject

export interface StateMapper {
  (state: State): State
}

export interface Operation {
  (options: Options): (next: StateMapper) => StateMapper
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
  $noDefaults?: boolean
  $flip?: boolean
  $transform?: undefined
  $filter?: undefined
  $if?: undefined
  $apply?: undefined
  $valud?: undefined
  $alt?: undefined
  $and?: undefined
  $or?: undefined
  $concat?: undefined
}

export type MapDefinition =
  | MapObject
  | Operation
  | OperationObject
  | MapPipe
  | Path
  | null

export interface MapTransform {
  (data: unknown): any
  rev: (data: unknown) => any
}
