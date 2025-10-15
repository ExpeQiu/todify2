import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import WorkflowPage from './pages/WorkflowPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<WorkflowPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App