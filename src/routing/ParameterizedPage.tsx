import type { ReactElement } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'

export function ParameterizedPage({
  render,
  fallbackUrl
}: {
  render: (pathVariables: Record<string, string | undefined>, queryParameters: URLSearchParams) => ReactElement
  fallbackUrl?: string
}) {
  const pathVariables = useParams()
  const [queryParameters] = useSearchParams()

  try {
    return render(pathVariables, queryParameters)
  } catch (error) {
    if (fallbackUrl) {
      return <Navigate replace to={fallbackUrl} />
    }

    throw error
  }
}
