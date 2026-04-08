export function decodeProjectIdParam(projectId: string | undefined): string | null {
  if (!projectId) return null

  try {
    return decodeURIComponent(projectId)
  } catch {
    return null
  }
}
