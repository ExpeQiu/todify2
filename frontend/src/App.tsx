// import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WorkflowPage from './pages/WorkflowPage'
import NodePage from './pages/NodePage'
import ConfigManagementPage from './pages/ConfigManagementPage'
import TechPointManagement from './pages/TechPointManagement'
import CarSeriesManagement from './pages/CarSeriesManagement'
import CarSeriesDetailPage from './components/carSeries/CarSeriesDetailPage'
import TestComponent from './test'
import './App.css'

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <div className="App">
        <Routes>
          <Route path="/" element={<TestComponent />} />
          <Route path="/workflow" element={<WorkflowPage />} />
          <Route path="/node/:nodeType" element={<NodePage />} />
          <Route path="/config" element={<ConfigManagementPage />} />
          <Route path="/tech-points" element={<TechPointManagement />} />
          <Route path="/car-series" element={<CarSeriesManagement />} />
          <Route path="/car-series/:id" element={<CarSeriesDetailPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App