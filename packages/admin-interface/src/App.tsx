import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminLogin, Dashboard, WalletProvider } from './components';
import type { AdminUser } from './services/adminAuth';
import './index.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Check for existing session on app load
  useEffect(() => {
    const savedWallet = localStorage.getItem('adminWallet');
    const savedAdmin = localStorage.getItem('adminUser');
    if (savedWallet && savedAdmin) {
      setWalletAddress(savedWallet);
      setAdminUser(JSON.parse(savedAdmin));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (address: string, admin: AdminUser) => {
    setWalletAddress(address);
    setAdminUser(admin);
    setIsAuthenticated(true);
    localStorage.setItem('adminWallet', address);
    localStorage.setItem('adminUser', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setWalletAddress('');
    setAdminUser(null);
    localStorage.removeItem('adminWallet');
    localStorage.removeItem('adminUser');
  };

  return (
    <WalletProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ?
                  <Navigate to="/dashboard" replace /> :
                  <AdminLogin onLogin={handleLogin} />
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ?
                  <Dashboard walletAddress={walletAddress} adminUser={adminUser} onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/"
              element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />}
            />
          </Routes>
        </div>
      </Router>
    </WalletProvider>
  );
}

export default App;
