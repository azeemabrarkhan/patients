import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock setTimeout for testing
jest.useFakeTimers()

describe('/api/fhir/Patient', () => {
  beforeEach(() => {
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const createMockRequest = (searchParams: Record<string, string> = {}) => {
    const url = new URL('http://localhost:3000/api/fhir/Patient')
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })
    
    return new NextRequest(url.toString(), {
      method: 'GET'
    })
  }

  it('should return all patients when no search parameters are provided', async () => {
    const request = createMockRequest()
    
    // Fast-forward timers to skip the simulated delay
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data.resourceType).toBe('Bundle')
    expect(data.type).toBe('searchset')
    expect(data.total).toBe(5) // We have 5 mock patients
    expect(data.entry).toHaveLength(5)
    
    // Check first patient
    const firstPatient = data.entry[0].resource
    expect(firstPatient.resourceType).toBe('Patient')
    expect(firstPatient.id).toBe('1')
    expect(firstPatient.name[0].family).toBe('Smith')
  })

  it('should filter patients by search term', async () => {
    const request = createMockRequest({ _search: 'John' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.total).toBe(1)
    expect(data.entry[0].resource.name[0].given).toContain('John')
  })

  it('should filter patients by MRN', async () => {
    const request = createMockRequest({ _search: 'MRN-002' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.total).toBe(1)
    expect(data.entry[0].resource.identifier[0].value).toBe('MRN-002')
  })

  it('should filter patients by gender', async () => {
    const request = createMockRequest({ gender: 'male' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    
    // All returned patients should be male
    data.entry.forEach((entry: any) => {
      expect(entry.resource.gender).toBe('male')
    })
  })

  it('should filter patients by active status', async () => {
    const request = createMockRequest({ active: 'false' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    
    // All returned patients should be inactive
    data.entry.forEach((entry: any) => {
      expect(entry.resource.active).toBe(false)
    })
  })

  it('should apply pagination correctly', async () => {
    const request = createMockRequest({ _count: '2', _offset: '1' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.entry).toHaveLength(2)
    expect(data.total).toBe(5) // Total should still be 5
    
    // Should start from the second patient (offset 1)
    expect(data.entry[0].resource.id).toBe('2')
  })

  it('should combine multiple filters', async () => {
    const request = createMockRequest({ 
      gender: 'female',
      active: 'true',
      _count: '10'
    })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    
    // All returned patients should be active females
    data.entry.forEach((entry: any) => {
      expect(entry.resource.gender).toBe('female')
      expect(entry.resource.active).toBe(true)
    })
  })

  it('should return empty results for no matches', async () => {
    const request = createMockRequest({ _search: 'nonexistent' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.total).toBe(0)
    expect(data.entry).toHaveLength(0)
  })

  it('should return proper FHIR headers', async () => {
    const request = createMockRequest()
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    expect(response.headers.get('Content-Type')).toBe('application/fhir+json')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS')
  })

  it('should handle case-insensitive search', async () => {
    const request = createMockRequest({ _search: 'john' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.total).toBe(1)
    expect(data.entry[0].resource.name[0].given).toContain('John')
  })

  it('should handle partial name search', async () => {
    const request = createMockRequest({ _search: 'Smi' })
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.total).toBe(1)
    expect(data.entry[0].resource.name[0].family).toBe('Smith')
  })

  it('should include search mode in entry', async () => {
    const request = createMockRequest()
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    data.entry.forEach((entry: any) => {
      expect(entry.search.mode).toBe('match')
    })
  })

  it('should include timestamp in bundle', async () => {
    const request = createMockRequest()
    
    const responsePromise = GET(request)
    jest.advanceTimersByTime(1000)
    const response = await responsePromise
    
    const data = await response.json()
    expect(data.timestamp).toBeDefined()
    expect(new Date(data.timestamp)).toBeInstanceOf(Date)
  })
})
