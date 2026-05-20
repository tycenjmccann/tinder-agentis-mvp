import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

describe('/api/health', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns status ok with timestamp and version', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBe('2024-01-15T12:00:00.000Z')
    expect(body.version).toBe('0.1.0')
  })

  it('returns a valid ISO timestamp', async () => {
    vi.useRealTimers()
    const response = await GET()
    const body = await response.json()

    const parsedDate = new Date(body.timestamp)
    expect(parsedDate.toISOString()).toBe(body.timestamp)
  })

  it('returns correct content-type header', async () => {
    const response = await GET()
    expect(response.headers.get('content-type')).toContain('application/json')
  })
})
