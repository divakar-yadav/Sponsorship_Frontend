import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import TrainingData from './views/TrainingData/TrainingData';
import ModelFoundry from './views/ModelFoundry/ModelFoundry';
import HomePage from './views/HomePage/HomePage';
import AuthPage from './views/AuthPage/AuthPage';
import {
  FaHome, FaDatabase, FaProjectDiagram,
  FaUserCircle, FaChevronDown
} from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return children;
}

function App() {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return token && savedUser ? JSON.parse(savedUser) : null;
  });
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = location.pathname === '/auth';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {!isAuthPage && user && (
        <header className="top-navbar">
          <h2 className="app-title">
            <span className="app-title-icon">SP</span>
            Sponsorship Predictor
          </h2>

          <div className="auth-section" ref={dropdownRef}>
            <div
              className="auth-toggle"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownVisible((prev) => !prev);
              }}
            >
              <FaUserCircle size={28} />
              <span className="auth-name">{user.name}</span>
              <FaChevronDown size={14} />
            </div>

            {dropdownVisible && (
              <div className="auth-dropdown">
                <div className="auth-dropdown-item">Profile</div>
                <div className="auth-dropdown-item">Settings</div>
                <div
                  className="auth-dropdown-item"
                  onClick={() => {
                    setUser(null);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setDropdownVisible(false);
                    navigate('/auth');
                  }}
                >
                  Logout
                </div>
              </div>
            )}
          </div>
        </header>
      )}

      <div className="main-content">
        {!isAuthPage && user && (
          <nav className="side-nav">
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}><FaHome /> Predict</NavLink>
            <NavLink to="/model-foundry" className={({ isActive }) => isActive ? 'active' : ''}><FaProjectDiagram /> Model Foundry</NavLink>
            <NavLink to="/train" className={({ isActive }) => isActive ? 'active' : ''}><FaDatabase /> Training Dataset</NavLink>
          </nav>
        )}

        <div className="page-content">
          <Routes>
            <Route path="/auth" element={<AuthPage setUser={setUser} />} />
            <Route path="/" element={<ProtectedRoute user={user}><HomePage /></ProtectedRoute>} />
            <Route path="/model-foundry" element={<ProtectedRoute user={user}><ModelFoundry user={user} /></ProtectedRoute>} />
            <Route path="/train" element={<ProtectedRoute user={user}><TrainingData user={user} /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
