import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PatientList from '../PatientList'
import { FHIRService } from '@/services/fhirService'
import { FHIRBundle } from '@/types/fhir'

// Mock the FHIRService
jest.mock('@/services/fhirService', () => ({
  FHIRService: {
    searchPatients: jest.fn()
  },
  FHIRUtils: {
    getPatientFullName: jest.fn((patient) => `${patient.name?.[0]?.given?.join(' ')} ${patient.name?.[0]?.family}`.trim()),
    getPatientMRN: jest.fn((patient) => patient.identifier?.[0]?.value || 'N/A'),
    getPatientPhone: jest.fn((patient) => patient.telecom?.find((t: any) => t.system === 'phone')?.value || 'N/A'),
    getPatientEmail: jest.fn((patient) => patient.telecom?.find((t: any) => t.system === 'email')?.value || 'N/A'),
    getPatientAddress: jest.fn(() => '123 Main St, Springfield, IL'),
    formatBirthDate: jest.fn((date) => date ? 'Mar 15, 1985' : 'N/A'),
    calculateAge: jest.fn(() => 38)
  }
}))

const mockSearchPatients = FHIRService.searchPatients as jest.MockedFunction<typeof FHIRService.searchPatients>

const mockPatientBundle: FHIRBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 2,
  entry: [
    {
      resource: {
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
        birthDate: '1985-03-15'
      }
    },
    {
      resource: {
        resourceType: 'Patient',
        id: '2',
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
            value: 'MRN-002'
          }
        ],
        active: true,
        name: [
          {
            use: 'official',
            family: 'Johnson',
            given: ['Sarah', 'Elizabeth']
          }
        ],
        telecom: [
          {
            system: 'phone',
            value: '+1-555-0456',
            use: 'mobile'
          },
          {
            system: 'email',
            value: 'sarah.johnson@email.com',
            use: 'home'
          }
        ],
        gender: 'female',
        birthDate: '1992-07-22'
      }
    }
  ]
}

describe('PatientList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSearchPatients.mockResolvedValue(mockPatientBundle)
  })

  it('should render patient list with search and filter controls', async () => {
    render(<PatientList />)
    
    // Check for search input
    expect(screen.getByPlaceholderText(/search by name or medical record number/i)).toBeInTheDocument()
    
    // Check for filter button
    expect(screen.getByRole('button', { name: /filters/i })).toBeInTheDocument()
    
    // Wait for patients to load
    await waitFor(() => {
      expect(screen.getByText('John David Smith')).toBeInTheDocument()
      expect(screen.getByText('Sarah Elizabeth Johnson')).toBeInTheDocument()
    })
    
    // Check patient count display
    expect(screen.getByText(/showing 2 of 2 patients/i)).toBeInTheDocument()
  })

  it('should call API with search parameters when searching', async () => {
    const user = userEvent.setup()
    render(<PatientList />)
    
    const searchInput = screen.getByPlaceholderText(/search by name or medical record number/i)
    
    await user.type(searchInput, 'John')
    
    await waitFor(() => {
      expect(mockSearchPatients).toHaveBeenCalledWith(
        expect.objectContaining({
          _search: 'John',
          _count: 10,
          _offset: 0
        })
      )
    })
  })

  it('should show and hide filters when filter button is clicked', async () => {
    const user = userEvent.setup()
    render(<PatientList />)
    
    const filterButton = screen.getByRole('button', { name: /filters/i })
    
    // Filters should be hidden initially
    expect(screen.queryByText(/gender/i)).not.toBeInTheDocument()
    
    // Click to show filters
    await user.click(filterButton)
    
    // Filters should now be visible
    expect(screen.getByText(/gender/i)).toBeInTheDocument()
    expect(screen.getByText(/status/i)).toBeInTheDocument()
    
    // Click to hide filters
    await user.click(filterButton)
    
    // Filters should be hidden again
    expect(screen.queryByText(/gender/i)).not.toBeInTheDocument()
  })

  it('should call API with filter parameters when filters are applied', async () => {
    const user = userEvent.setup()
    render(<PatientList />)
    
    // Show filters
    const filterButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filterButton)
    
    // Select gender filter
    const genderSelect = screen.getByDisplayValue(/all genders/i)
    await user.selectOptions(genderSelect, 'male')
    
    await waitFor(() => {
      expect(mockSearchPatients).toHaveBeenCalledWith(
        expect.objectContaining({
          gender: 'male',
          _count: 10,
          _offset: 0
        })
      )
    })
  })

  it('should clear all filters when clear button is clicked', async () => {
    const user = userEvent.setup()
    render(<PatientList />)
    
    // Show filters
    const filterButton = screen.getByRole('button', { name: /filters/i })
    await user.click(filterButton)
    
    // Apply some filters
    const genderSelect = screen.getByDisplayValue(/all genders/i)
    await user.selectOptions(genderSelect, 'male')
    
    const statusSelect = screen.getByDisplayValue(/all statuses/i)
    await user.selectOptions(statusSelect, 'true')
    
    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i })
    await user.click(clearButton)
    
    // Check that filters are reset
    expect(genderSelect).toHaveValue('')
    expect(statusSelect).toHaveValue('')
  })

  it('should display loading state', async () => {
    // Mock a delayed response
    mockSearchPatients.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve(mockPatientBundle), 1000)
      )
    )
    
    render(<PatientList />)
    
    // Should show loading spinner
    expect(screen.getByText(/loading patients/i)).toBeInTheDocument()
  })

  it('should display error state when API call fails', async () => {
    mockSearchPatients.mockRejectedValue(new Error('Network error'))
    
    render(<PatientList />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading patients/i)).toBeInTheDocument()
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
    
    // Should show retry button
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('should retry API call when retry button is clicked', async () => {
    const user = userEvent.setup()
    
    // First call fails
    mockSearchPatients.mockRejectedValueOnce(new Error('Network error'))
    // Second call succeeds
    mockSearchPatients.mockResolvedValueOnce(mockPatientBundle)
    
    render(<PatientList />)
    
    // Wait for error state
    await waitFor(() => {
      expect(screen.getByText(/error loading patients/i)).toBeInTheDocument()
    })
    
    // Click retry
    const retryButton = screen.getByRole('button', { name: /try again/i })
    await user.click(retryButton)
    
    // Should make API call again
    expect(mockSearchPatients).toHaveBeenCalledTimes(2)
    
    // Should show patients after retry
    await waitFor(() => {
      expect(screen.getByText('John David Smith')).toBeInTheDocument()
    })
  })

  it('should display no results message when no patients found', async () => {
    const emptyBundle: FHIRBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 0,
      entry: []
    }
    
    mockSearchPatients.mockResolvedValue(emptyBundle)
    
    render(<PatientList />)
    
    await waitFor(() => {
      expect(screen.getByText(/no patients found/i)).toBeInTheDocument()
      expect(screen.getByText(/try adjusting your search criteria/i)).toBeInTheDocument()
    })
  })

  it('should load more patients when load more button is clicked', async () => {
    const user = userEvent.setup()
    
    // First call returns partial results
    const partialBundle: FHIRBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 20,
      entry: mockPatientBundle.entry
    }
    
    // Second call returns more results
    const moreResults: FHIRBundle = {
      resourceType: 'Bundle',
      type: 'searchset',
      total: 20,
      entry: [
        {
          resource: {
            resourceType: 'Patient',
            id: '3',
            identifier: [{ value: 'MRN-003' }],
            active: true,
            name: [{ family: 'Brown', given: ['Michael'] }],
            gender: 'male',
            birthDate: '1990-01-01'
          }
        }
      ]
    }
    
    mockSearchPatients
      .mockResolvedValueOnce(partialBundle)
      .mockResolvedValueOnce(moreResults)
    
    render(<PatientList />)
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('John David Smith')).toBeInTheDocument()
    })
    
    // Should show load more button
    const loadMoreButton = screen.getByRole('button', { name: /load more patients/i })
    expect(loadMoreButton).toBeInTheDocument()
    
    // Click load more
    await user.click(loadMoreButton)
    
    // Should make second API call with offset
    await waitFor(() => {
      expect(mockSearchPatients).toHaveBeenCalledWith(
        expect.objectContaining({
          _offset: 10
        })
      )
    })
  })

  it('should display patient information correctly', async () => {
    render(<PatientList />)
    
    await waitFor(() => {
      // Check patient names
      expect(screen.getByText('John David Smith')).toBeInTheDocument()
      expect(screen.getByText('Sarah Elizabeth Johnson')).toBeInTheDocument()
      
      // Check MRNs
      expect(screen.getByText('MRN: MRN-001')).toBeInTheDocument()
      expect(screen.getByText('MRN: MRN-002')).toBeInTheDocument()
      
      // Check gender display
      expect(screen.getByText('Male')).toBeInTheDocument()
      expect(screen.getByText('Female')).toBeInTheDocument()
      
      // Check active status
      const activeStatuses = screen.getAllByText('Active')
      expect(activeStatuses).toHaveLength(2)
    })
  })
})
