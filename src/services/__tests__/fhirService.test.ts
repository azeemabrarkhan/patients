import { FHIRService, FHIRUtils } from '../fhirService'
import { Patient } from '@/types/fhir'

// Mock fetch globally
global.fetch = jest.fn()

describe('FHIRService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:3000'
      },
      writable: true
    })
  })

  describe('searchPatients', () => {
    it('should fetch patients with correct URL and parameters', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 1,
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: '1',
              name: [{ family: 'Doe', given: ['John'] }]
            }
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBundle
      })

      const result = await FHIRService.searchPatients({
        _search: 'John',
        gender: 'male',
        _count: 10
      })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/fhir/Patient?_search=John&gender=male&_count=10',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/fhir+json',
            'Content-Type': 'application/fhir+json'
          }
        }
      )

      expect(result).toEqual(mockBundle)
    })

    it('should handle empty search parameters', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        total: 0,
        entry: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBundle
      })

      await FHIRService.searchPatients({})

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/fhir/Patient',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    it('should handle HTTP errors', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({})
      })

      await expect(FHIRService.searchPatients({})).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      )
    })

    it('should handle FHIR OperationOutcome errors', async () => {
      const operationOutcome = {
        resourceType: 'OperationOutcome',
        issue: [
          {
            severity: 'error',
            code: 'processing',
            diagnostics: 'Invalid search parameter'
          }
        ]
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => operationOutcome
      })

      await expect(FHIRService.searchPatients({})).rejects.toThrow(
        'Invalid search parameter'
      )
    })
  })

  describe('getPatientById', () => {
    it('should fetch patient by ID', async () => {
      const mockBundle = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: []
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBundle
      })

      await FHIRService.getPatientById('123')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/fhir/Patient/123',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })
})

describe('FHIRUtils', () => {
  const mockPatient: Patient = {
    resourceType: 'Patient',
    id: '1',
    identifier: [
      {
        use: 'usual',
        type: {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
              code: 'MR',
              display: 'Medical record number'
            }
          ]
        },
        value: 'MRN-001'
      }
    ],
    active: true,
    name: [
      {
        use: 'official',
        family: 'Smith',
        given: ['John', 'David']
      }
    ],
    telecom: [
      {
        system: 'phone',
        value: '+1-555-0123',
        use: 'home'
      },
      {
        system: 'email',
        value: 'john.smith@email.com',
        use: 'home'
      }
    ],
    gender: 'male',
    birthDate: '1985-03-15',
    address: [
      {
        use: 'home',
        line: ['123 Main St'],
        city: 'Springfield',
        state: 'IL',
        postalCode: '62701',
        country: 'US'
      }
    ]
  }

  describe('getPatientFullName', () => {
    it('should return full name for valid patient', () => {
      const result = FHIRUtils.getPatientFullName(mockPatient)
      expect(result).toBe('John David Smith')
    })

    it('should handle missing name', () => {
      const patientWithoutName = { ...mockPatient, name: undefined }
      const result = FHIRUtils.getPatientFullName(patientWithoutName)
      expect(result).toBe('Unknown')
    })

    it('should handle empty name array', () => {
      const patientWithEmptyName = { ...mockPatient, name: [] }
      const result = FHIRUtils.getPatientFullName(patientWithEmptyName)
      expect(result).toBe('Unknown')
    })

    it('should handle name with only family name', () => {
      const patientFamilyOnly = {
        ...mockPatient,
        name: [{ family: 'Smith' }]
      }
      const result = FHIRUtils.getPatientFullName(patientFamilyOnly)
      expect(result).toBe('Smith')
    })
  })

  describe('getPatientMRN', () => {
    it('should return MRN for valid patient', () => {
      const result = FHIRUtils.getPatientMRN(mockPatient)
      expect(result).toBe('MRN-001')
    })

    it('should handle missing identifier', () => {
      const patientWithoutIdentifier = { ...mockPatient, identifier: undefined }
      const result = FHIRUtils.getPatientMRN(patientWithoutIdentifier)
      expect(result).toBe('N/A')
    })

    it('should return first identifier if no MRN found', () => {
      const patientWithNonMRN = {
        ...mockPatient,
        identifier: [
          {
            use: 'usual',
            type: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
                  code: 'SS',
                  display: 'Social Security Number'
                }
              ]
            },
            value: 'SSN-123'
          }
        ]
      }
      const result = FHIRUtils.getPatientMRN(patientWithNonMRN)
      expect(result).toBe('SSN-123')
    })
  })

  describe('getPatientPhone', () => {
    it('should return phone number for valid patient', () => {
      const result = FHIRUtils.getPatientPhone(mockPatient)
      expect(result).toBe('+1-555-0123')
    })

    it('should handle missing telecom', () => {
      const patientWithoutTelecom = { ...mockPatient, telecom: undefined }
      const result = FHIRUtils.getPatientPhone(patientWithoutTelecom)
      expect(result).toBe('N/A')
    })
  })

  describe('getPatientEmail', () => {
    it('should return email for valid patient', () => {
      const result = FHIRUtils.getPatientEmail(mockPatient)
      expect(result).toBe('john.smith@email.com')
    })

    it('should handle missing email', () => {
      const patientWithoutEmail = {
        ...mockPatient,
        telecom: [
          {
            system: 'phone',
            value: '+1-555-0123',
            use: 'home'
          }
        ]
      }
      const result = FHIRUtils.getPatientEmail(patientWithoutEmail)
      expect(result).toBe('N/A')
    })
  })

  describe('getPatientAddress', () => {
    it('should return formatted address for valid patient', () => {
      const result = FHIRUtils.getPatientAddress(mockPatient)
      expect(result).toBe('123 Main St, Springfield, IL, 62701')
    })

    it('should handle missing address', () => {
      const patientWithoutAddress = { ...mockPatient, address: undefined }
      const result = FHIRUtils.getPatientAddress(patientWithoutAddress)
      expect(result).toBe('N/A')
    })
  })

  describe('formatBirthDate', () => {
    it('should format valid birth date', () => {
      const result = FHIRUtils.formatBirthDate('1985-03-15')
      expect(result).toBe('Mar 15, 1985')
    })

    it('should handle invalid birth date', () => {
      const result = FHIRUtils.formatBirthDate('invalid-date')
      expect(result).toBe('invalid-date')
    })

    it('should handle missing birth date', () => {
      const result = FHIRUtils.formatBirthDate(undefined)
      expect(result).toBe('N/A')
    })
  })

  describe('calculateAge', () => {
    // Mock current date for consistent testing
    const mockCurrentDate = new Date('2024-01-15')
    
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(mockCurrentDate)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate correct age', () => {
      const result = FHIRUtils.calculateAge('1985-03-15')
      expect(result).toBe(38) // 2024 - 1985 = 39, but birthday hasn't passed yet
    })

    it('should handle birthday that has passed this year', () => {
      const result = FHIRUtils.calculateAge('1985-01-01')
      expect(result).toBe(39)
    })

    it('should handle missing birth date', () => {
      const result = FHIRUtils.calculateAge(undefined)
      expect(result).toBeNull()
    })

    it('should handle invalid birth date', () => {
      const result = FHIRUtils.calculateAge('invalid-date')
      expect(result).toBeNull()
    })
  })
})
