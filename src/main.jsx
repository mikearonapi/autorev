import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Global styles
import './styles/globals.css';

// Error Boundary for catching runtime errors
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Layout from './components/Layout';

// Pages
import Home from './pages/Home';
import Advisory from './pages/Advisory';
import Upgrades from './pages/Upgrades';
import Services from './pages/Services';
import Contact from './pages/Contact';
import CarDetail from './pages/CarDetail';
import Performance from './pages/Performance';
import NotFound from './pages/NotFound';

// Import the car-specific Performance HUB wrapper
import CarPerformance from './pages/CarPerformance';

/**
 * SuperNatural Motorsports - Main Application
 * 
 * Route structure:
 *   /                    - Home (brand hero, overview, CTAs)
 *   /advisory            - Car Selector (recommendation engine)
 *   /performance         - Performance HUB (standalone, select car first)
 *   /cars/:slug          - Car Detail (hero page for individual car)
 *   /cars/:slug/performance - Performance HUB (pre-selected car)
 *   /upgrades            - Upgrade Advisory (intake form, paths)
 *   /services            - Services (offerings, process)
 *   /contact             - Contact (form, FAQs)
 *   *                    - 404 Not Found
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="advisory" element={<Advisory />} />
            <Route path="performance" element={<Performance />} />
            <Route path="cars/:slug" element={<CarDetail />} />
            <Route path="cars/:slug/performance" element={<CarPerformance />} />
            <Route path="upgrades" element={<Upgrades />} />
            <Route path="services" element={<Services />} />
            <Route path="contact" element={<Contact />} />
            {/* 404 catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
