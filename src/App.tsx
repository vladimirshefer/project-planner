import { Route, Routes } from 'react-router-dom'
import { EditorProjectPage } from './pages/EditorPage'
import { LandingPage } from './pages/LandingPage'
import { LandingPageV2 } from './pages/LandingPageV2'
import { NewProjectPage } from './pages/NewProjectPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SharePage } from './pages/SharePage'
import { TimelinePage } from './pages/TimelinePage'
import { WorkersPage } from './pages/WorkersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageV2 />} />
      <Route path="/landing-v1" element={<LandingPage />} />
      <Route path="/share" element={<SharePage />} />
      <Route path="/projects" element={<ProjectsPage />} />
      <Route path="/projects/new" element={<NewProjectPage />} />
      <Route path="/projects/:projectId" element={<EditorProjectPage />} />
      <Route path="/projects/:projectId/workers" element={<WorkersPage />} />
      <Route path="/projects/:projectId/timeline" element={<TimelinePage />} />
    </Routes>
  )
}
