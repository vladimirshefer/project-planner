import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ParameterizedPage } from './ParameterizedPage'

describe('ParameterizedPage', () => {
  it('passes raw path variables unchanged', () => {
    let capturedProjectId: string | undefined

    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/projects/draft%2F2026_04_08_01_30/workers']}>
        <Routes>
          <Route
            path="/projects/:projectId/workers"
            element={
              <ParameterizedPage
                render={(pathVariables) => {
                  capturedProjectId = pathVariables.projectId
                  return <div>workers</div>
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(capturedProjectId).toBe('draft/2026_04_08_01_30')
  })

  it('passes live URLSearchParams', () => {
    let capturedQueryParameters: URLSearchParams | undefined

    renderToStaticMarkup(
      <MemoryRouter initialEntries={['/projects/123?focusNodeId=node-1&focusNodeId=node-2']}>
        <Routes>
          <Route
            path="/projects/:projectId"
            element={
              <ParameterizedPage
                render={(_pathVariables, queryParameters) => {
                  capturedQueryParameters = queryParameters
                  return <div>editor</div>
                }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(capturedQueryParameters).toBeDefined()

    if (!capturedQueryParameters) {
      throw new Error('Expected query parameters to be captured')
    }

    expect(capturedQueryParameters.get('focusNodeId')).toBe('node-1')
    expect(capturedQueryParameters.getAll('focusNodeId')).toEqual(['node-1', 'node-2'])
  })

  it('does not rethrow when fallbackUrl exists and route render fails', () => {
    expect(() =>
      renderToStaticMarkup(
        <MemoryRouter initialEntries={['/projects/123/workers']}>
          <Routes>
            <Route
              path="/projects/:projectId/workers"
              element={
                <ParameterizedPage
                  fallbackUrl="/not-found"
                  render={() => {
                    throw new Error('boom')
                  }}
                />
              }
            />
            <Route path="/not-found" element={<div>not found</div>} />
          </Routes>
        </MemoryRouter>
      )
    ).not.toThrow()
  })

  it('rethrows when fallbackUrl is missing and route render fails', () => {
    expect(() =>
      renderToStaticMarkup(
        <MemoryRouter initialEntries={['/projects/123/workers']}>
          <Routes>
            <Route
              path="/projects/:projectId/workers"
              element={
                <ParameterizedPage
                  render={() => {
                    throw new Error('boom')
                  }}
                />
              }
            />
          </Routes>
        </MemoryRouter>
      )
    ).toThrow('boom')
  })
})
