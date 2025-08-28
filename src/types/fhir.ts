// FHIR R4 Patient Resource Types
export interface Identifier {
  use?: string
  type?: {
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }
  value?: string
}

export interface HumanName {
  use?: string
  family?: string
  given?: string[]
}

export interface ContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
  value?: string
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
}

export interface Address {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
  line?: string[]
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface ContactPerson {
  relationship?: Array<{
    coding?: Array<{
      system?: string
      code?: string
      display?: string
    }>
  }>
  name?: HumanName
  telecom?: ContactPoint[]
}

export interface Patient {
  resourceType: 'Patient'
  id: string
  identifier?: Identifier[]
  active?: boolean
  name?: HumanName[]
  telecom?: ContactPoint[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  address?: Address[]
  contact?: ContactPerson[]
}

export interface BundleEntry {
  resource: Patient
  search?: {
    mode?: string
  }
}

export interface FHIRBundle {
  resourceType: 'Bundle'
  id?: string
  type: 'searchset' | 'collection' | 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset'
  timestamp?: string
  total?: number
  entry?: BundleEntry[]
}

export interface OperationOutcome {
  resourceType: 'OperationOutcome'
  issue: Array<{
    severity: 'fatal' | 'error' | 'warning' | 'information'
    code: string
    diagnostics?: string
  }>
}

// Search parameters interface
export interface PatientSearchParams {
  _search?: string
  gender?: string
  active?: string
  _count?: number
  _offset?: number
}
