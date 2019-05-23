export interface ObjectWithProps {
  [key: string]: Data
}

export type Prop = string | number | boolean | object | null | undefined | ObjectWithProps

export type Data = Prop | Prop[]

export interface State {
  root: Data,
  context: Data,
  value: Data,
  rev?: boolean,
  onlyMapped?: boolean,
  arr?: boolean,
  operations?: OperationsStore
}

export type Path = string

export interface MapFunction {
  (state: State): State
}

export interface DataMapper {
  (data: Data): Data
}

export interface Operands {
  [operand: string]: any
}

export interface Operation extends Operands {
  $op: string
}

export interface OperationFunction {
  (data: Data, operands: Operands): Data
}

export interface OperationsStore {
  [key: string]: OperationFunction
}

type MapPipeSimple = (MapFunction | Path | MapObject | Operation)[]

export type MapPipe = (MapFunction | Path | MapObject | Operation | MapPipeSimple)[]

export interface MapObject {
  [key: string]: MapDefinition
}

export type MapDefinition = MapObject | MapFunction | MapPipe | Operation | Path | null

export interface DataMapperWithOnlyMappedValues extends DataMapper {
  onlyMappedValues: DataMapper
}

export interface MapTransform extends DataMapperWithOnlyMappedValues {
  rev: DataMapperWithOnlyMappedValues
}
