import { Route, Routes } from 'react-router-dom'
import { EditorProjectPage } from './pages/EditorPage'
import { LandingPage } from './pages/LandingPage'
import { LandingPageV2 } from './pages/LandingPageV2'
import { MissingProjectPage } from './pages/MissingProjectPage'
import { NewProjectPage } from './pages/NewProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SharePage } from './pages/SharePage'
import { TimelinePage } from './pages/TimelinePage'
import { WorkersPage } from './pages/WorkersPage'
import { decodeProjectIdParam } from './pages/project-routes'
import { ParameterizedPage } from './routing/ParameterizedPage'

function decodeRequiredProjectId(projectId: string): string {
  const decodedProjectId = decodeProjectIdParam(projectId)

  if (!decodedProjectId) {
    throw new Error('Invalid project id')
  }

  return decodedProjectId
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageV2 />} />
      <Route path="/landing-v1" element={<LandingPage />} />
      <Route path="/not-found" element={<MissingProjectPage />} />
      <Route
        path="/share"
        element={
          <ParameterizedPage
            render={(_pathVariables, queryParameters) => (
              <SharePage payload={queryParameters.get('s')?.trim() ?? ''} />
            )}
          />
        }
      />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route
        path="/projects/new"
        element={
          <ParameterizedPage
            render={(_pathVariables, queryParameters) => (
              <NewProjectPage template={queryParameters.get('template')} />
            )}
          />
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <ParameterizedPage
            fallbackUrl="/not-found"
            render={(pathVariables, queryParameters) => (
              <EditorProjectPage
                projectId={decodeRequiredProjectId(pathVariables.projectId!)}
                focusNodeId={queryParameters.get('focusNodeId')}
              />
            )}
          />
        }
      />
      <Route
        path="/projects/:projectId/workers"
        element={
          <ParameterizedPage
            render={(pathVariables) => <WorkersPage projectId={decodeRequiredProjectId(pathVariables.projectId!)} />}
            fallbackUrl="/not-found"
          />
        }
      />
      <Route
        path="/projects/:projectId/timeline"
        element={
          <ParameterizedPage
            render={(pathVariables) => <TimelinePage projectId={decodeRequiredProjectId(pathVariables.projectId!)} />}
            fallbackUrl="/not-found"
          />
        }
      />
    </Routes>
  )
}
