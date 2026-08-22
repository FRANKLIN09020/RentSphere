export type FieldKind = 'text' | 'email' | 'password' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'image'

export type FieldConfig = {
  name: string
  label: string
  kind?: FieldKind
  required?: boolean
  options?: string[]
  hideInTable?: boolean
  full?: boolean
}

export type ModuleConfig = {
  resource: string
  title: string
  description: string
  fields: FieldConfig[]
  tableColumns: string[]
}

export type RecordData = Record<string, unknown>
