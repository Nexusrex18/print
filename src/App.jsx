import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import PrintSettings from './components/PrintSettings';
import Footer from './components/Footer';
import NotFoundPage from './components/NotFoundPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/print-settings" element={<PrintSettings />} />
        <Route path='*' element={<NotFoundPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;