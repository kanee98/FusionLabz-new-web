import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { publicApi } from './lib/api';
import type { BootstrapPayload, Project } from './types';
import { useLenis } from './hooks/useLenis';
import { CosmicCanvas } from './components/CosmicCanvas';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProjectModal } from './components/ProjectModal';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { CareersPage } from './pages/CareersPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPortal } from './pages/admin/AdminLayout';

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isHome = location.pathname === '/';

  useLenis(!isAdmin);

  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchBootstrap = useCallback(() => {
    publicApi
      .bootstrap()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed loading FusionLabz data:', err));
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    window.scrollTo(0, 0);
    window.__flzLenis?.scrollTo(0, { immediate: true });
  }, [location.pathname]);

  if (isAdmin) {
    return <AdminPortal onDataMutated={fetchBootstrap} />;
  }

  return (
    <div className="relative min-h-screen bg-[#F8FBFF] text-[#09152B]">
      <CosmicCanvas intensity={isHome ? 'hero' : 'ambient'} />
      <Navbar openJobsCount={data?.jobs?.length || 0} />

      <main>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                settings={data?.settings || null}
                projects={data?.projects || []}
                clients={data?.clients || []}
                jobs={data?.jobs || []}
                onSelectProject={setSelectedProject}
              />
            }
          />
          <Route
            path="/portfolio"
            element={
              <PortfolioPage
                projects={data?.projects || []}
                clients={data?.clients || []}
                onSelectProject={setSelectedProject}
              />
            }
          />
          <Route path="/careers" element={<CareersPage jobs={data?.jobs || []} />} />
          <Route path="/contact" element={<ContactPage settings={data?.settings || null} />} />
          <Route
            path="*"
            element={
              <HomePage
                settings={data?.settings || null}
                projects={data?.projects || []}
                clients={data?.clients || []}
                jobs={data?.jobs || []}
                onSelectProject={setSelectedProject}
              />
            }
          />
        </Routes>
      </main>

      <Footer settings={data?.settings || null} />
      <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
