import { describe, expect, it } from 'vitest'
import { decodeProjectIdParam } from './project-routes'

describe('project-routes', () => {
  it('decodes encoded project ids from route params', () => {
    expect(decodeProjectIdParam('draft%2F2026_04_08_01_30')).toBe('draft/2026_04_08_01_30')
    expect(decodeProjectIdParam('work%2Fproject-1')).toBe('work/project-1')
  })

  it('returns null for missing or invalid route params', () => {
    expect(decodeProjectIdParam(undefined)).toBeNull()
    expect(decodeProjectIdParam('%E0%A4%A')).toBeNull()
  })
})
