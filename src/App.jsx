import './App.css'
import Editor from './Component/Editor'
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
}from  'react-router-dom'
import { v4 as uuidv4 } from 'uuid';
function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<Navigate to={`/documents/${uuidv4()}`} />} />
        <Route path="/documents/:id" element={<Editor />} />
      </Routes>
    </Router>
  );
}

export default App
