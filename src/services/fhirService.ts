import { FHIRBundle, OperationOutcome, PatientSearchParams } from '@/types/fhir'

const FHIR_BASE_URL = process.env.NEXT_PUBLIC_FHIR_BASE_URL || '/api/fhir'

export class FHIRService {
  private static async makeRequest<T>(
    endpoint: string,
    searchParams?: Record<string, string | number>
  ): Promise<T> {
    const url = new URL(`${FHIR_BASE_URL}${endpoint}`, window.location.origin)
    
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, value.toString())
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/fhir+json',
        'Content-Type': 'application/fhir+json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      
      if (errorData && errorData.resourceType === 'OperationOutcome') {
        const operationOutcome = errorData as OperationOutcome
        const errorMessage = operationOutcome.issue
          .map(issue => issue.diagnostics || `${issue.severity}: ${issue.code}`)
          .join(', ')
        throw new Error(errorMessage)
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  }

  static async searchPatients(searchParams: PatientSearchParams = {}): Promise<FHIRBundle> {
    const params: Record<string, string | number> = {}
    
    if (searchParams._search) {
      params._search = searchParams._search
    }
    if (searchParams.gender) {
      params.gender = searchParams.gender
    }
    if (searchParams.active !== undefined) {
      params.active = searchParams.active
    }
    if (searchParams._count !== undefined) {
      params._count = searchParams._count
    }
    if (searchParams._offset !== undefined) {
      params._offset = searchParams._offset
    }

    return this.makeRequest<FHIRBundle>('/Patient', params)
  }

  static async getPatientById(id: string): Promise<FHIRBundle> {
    return this.makeRequest<FHIRBundle>(`/Patient/${id}`)
  }
}

// Utility functions for working with FHIR data
export class FHIRUtils {
  static getPatientFullName(patient: any): string {
    if (!patient.name || !patient.name[0]) return 'Unknown'
    
    const name = patient.name[0]
    const given = name.given ? name.given.join(' ') : ''
    const family = name.family || ''
    
    return `${given} ${family}`.trim() || 'Unknown'
  }

  static getPatientMRN(patient: any): string {
    if (!patient.identifier) return 'N/A'
    
    const mrn = patient.identifier.find((id: any) => 
      id.type?.coding?.[0]?.code === 'MR'
    )
    
    return mrn?.value || patient.identifier[0]?.value || 'N/A'
  }

  static getPatientPhone(patient: any): string {
    if (!patient.telecom) return 'N/A'
    
    const phone = patient.telecom.find((contact: any) => 
      contact.system === 'phone'
    )
    
    return phone?.value || 'N/A'
  }

  static getPatientEmail(patient: any): string {
    if (!patient.telecom) return 'N/A'
    
    const email = patient.telecom.find((contact: any) => 
      contact.system === 'email'
    )
    
    return email?.value || 'N/A'
  }

  static getPatientAddress(patient: any): string {
    if (!patient.address || !patient.address[0]) return 'N/A'
    
    const address = patient.address[0]
    const line = address.line ? address.line.join(', ') : ''
    const city = address.city || ''
    const state = address.state || ''
    const postalCode = address.postalCode || ''
    
    const parts = [line, city, state, postalCode].filter(Boolean)
    return parts.join(', ') || 'N/A'
  }

  static formatBirthDate(birthDate?: string): string {
    if (!birthDate) return 'N/A'
    
    try {
      const date = new Date(birthDate)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return birthDate
    }
  }

  static calculateAge(birthDate?: string): number | null {
    if (!birthDate) return null
    
    try {
      const birth = new Date(birthDate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    } catch {
      return null
    }
  }
}
