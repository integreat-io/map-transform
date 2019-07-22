export interface ObjectWithProps {
  [key: string]: Data
}

export type Prop =
  | string
  | number
  | boolean
  | null
  | undefined
  | object
  | ObjectWithProps

export type Data = Prop | Prop[]

export type Path = string

export interface Operands {
  [key: string]: Data
}

export interface Context {
  rev: boolean
  onlyMappedValues: boolean
}

export interface DataMapper {
  (data: Data, context: Context): Data
}

export interface CustomFunction<T = Operands> {
  (operands: T): DataMapper
}

export interface State {
  root: Data
  context: Data
  value: Data
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
}

export interface Operation {
  (options: Options): StateMapper
}

export interface MapFunction {
  (options: Options): (state: State) => State
}

type MapPipeSimple = (MapObject | Operation | OperationObject | Path)[]

export type MapPipe = (
  | MapObject
  | Operation
  | OperationObject
  | Path
  | MapPipeSimple)[]

export interface MapObject {
  [key: string]: MapDefinition | undefined | boolean
  $iterate?: boolean
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
  (data: Data): Data
  onlyMappedValues: (data: Data) => Data
}

export interface MapTransform extends MapTransformWithOnlyMappedValues {
  rev: MapTransformWithOnlyMappedValues
}
