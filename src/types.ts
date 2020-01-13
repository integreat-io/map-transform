export type Prop = string | number | boolean | null | undefined | Date

export type Data = Prop | ObjectWithProps | DataArray

export interface ObjectWithProps {
  [key: string]: Data
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DataArray extends Array<Data> {}

export type Path = string

export type DictionaryValue = string | number | boolean | null | undefined

export type DictionaryTuple = readonly [DictionaryValue, DictionaryValue]
export type Dictionary = DictionaryTuple[]

export interface Dictionaries {
  [key: string]: Dictionary
}

export interface ValueFunction {
  (): Data
}

export interface Operands {
  [key: string]: Data | ValueFunction
}

export interface Context {
  rev: boolean
  onlyMappedValues: boolean
}

export interface DataMapper {
  (data: Data, context: Context): Data
}

export interface CustomFunction<T = Operands> {
  (operands: T, options: Options): DataMapper
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
  dictionaries?: Dictionaries
  mutateNull?: boolean
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
  | MapPipeSimple
)[]

export interface MapObject {
  [key: string]: MapDefinition | undefined | boolean
  $iterate?: boolean
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
  (data: Data): Data
  onlyMappedValues: (data: Data) => Data
}

export interface MapTransform extends MapTransformWithOnlyMappedValues {
  rev: MapTransformWithOnlyMappedValues
}
