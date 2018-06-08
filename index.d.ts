// Definitions file for map-transform
declare function mapTransform (mapping: object): (data: object) => object

export interface IFieldMapping {
  path: string,
  default?: any
}

export interface IMapping {
  fields: {
    [key: string]: string | IFieldMapping
  },
  path?: string
}

type IDataProperty = string | number | object

export interface IData {
  [key: string]: IDataProperty | IDataProperty[]
}

export default mapTransform
