import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProjectDetail from './pages/ProjectDetail';
import ProjectBugs from './pages/ProjectBugs';
import SprintIterations from './pages/SprintIterations';
import ProjectRequirements from './pages/ProjectRequirements';
import Settings from './pages/Settings';
import ProjectSettings from './pages/ProjectSettings';
import ProjectTestCases from './pages/ProjectTestCases';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={zhCN}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Navigate to="/" replace />} />
              <Route path="/projects/:projectId" element={<SprintIterations />} />
              <Route path="/projects/:projectId/iterations" element={<SprintIterations />} />
              <Route path="/projects/:projectId/requirements" element={<ProjectRequirements />} />
              <Route path="/projects/:projectId/testcases" element={<ProjectTestCases />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/projects/:projectId/settings" element={<ProjectSettings />} />
            </Routes>
          </Layout>
        </Router>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
