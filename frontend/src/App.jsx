import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import Chat from './components/Chat/Chat';
import Login from './pages/Login/Login';
import WorkWithDB from './components/WorkWithDB/WorkWithDB';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeWorkspace, setActiveWorkspace] = useState(() => {
    const saved = localStorage.getItem('activeWorkspace');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
  };

  const handleSetWorkspace = (ws) => {
    setActiveWorkspace(ws);
    localStorage.setItem('activeWorkspace', JSON.stringify(ws));
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div style={{ color: 'white', fontSize: '18px' }}>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Sidebar onLogout={handleLogout} />
        <div className="main-body">
          <Routes>
            {/* Chat route */}
            <Route path="/" element={<Chat setActiveWorkspace={handleSetWorkspace} />} />

            {/* DB Editor route */}
            <Route path="/db" element={activeWorkspace ? (
              <WorkWithDB schema={activeWorkspace.schema} table={activeWorkspace.table} />
            ) : (
              <Navigate to="/" />
            )}/>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
