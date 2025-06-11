// src/views/AuthPage/AuthPage.js
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUserCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import './AuthPage.css';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AuthPage = ({ setUser }) => {
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuth = async () => {
    const endpoint = authMode === 'signup' ? '/api/signup' : '/api/login';
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: authMode === 'signup' ? name : undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (authMode === 'login') {
          setUser({ name: data.user.name, email: data.user.email });
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify({ name: data.user.name, email: data.user.email }));
          toast.success('Login successful!');
          navigate(location.state?.from?.pathname || '/');
        } else {
          toast.success('Signup successful. Please log in.');
          setAuthMode('login');
        }
      } else {
        toast.error(data.error || 'Authentication failed.');
      }
    } catch (err) {
      toast.error('Server error: ' + err.message);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-box">
        <FaUserCircle size={60} className="auth-icon" />
        <h2>{authMode === 'signup' ? 'Sign up for SP' : 'Sign in to SP'}</h2>

        {authMode === 'signup' && (
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="auth-input"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="auth-input"
        />

        <div className="auth-password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <span onClick={() => setShowPassword(!showPassword)} className="auth-password-toggle">
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button className="auth-btn" onClick={handleAuth}>
          {authMode === 'signup' ? 'Sign Up' : 'Log In'}
        </button>

        <p className="auth-toggle-text">
          {authMode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
          <span onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>
            {authMode === 'signup' ? 'Login' : 'Sign up'}
          </span>
        </p>
      </div>

      {/* <div className="auth-footer-message">
        <p className="auth-tagline">“Transforming sponsorship decisions into data-driven certainty.”</p>
        <p className="auth-techstack">
          ⚙️ Built on React, Flask & Azure — with just the right amount of machine learning 🧠
        </p>
      </div> */}
    </div>
  );
};

export default AuthPage;
