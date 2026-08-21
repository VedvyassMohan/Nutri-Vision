import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (loginState) => {
    setIsLogin(loginState);
    setIsForgot(false);
    setError('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isForgot) {
        if (!formData.password) {
          throw new Error('Please enter a new password');
        }
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await authService.resetPassword(formData.email, formData.password);
        setSuccessMsg('Password reset successfully! Please sign in with your new password.');
        setTimeout(() => {
          setIsForgot(false);
          setIsLogin(true);
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
        }, 1800);
      } else if (isLogin) {
        await authService.login(formData.email, formData.password);
        window.dispatchEvent(new Event('auth-change'));
        navigate('/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await authService.signUp({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        window.dispatchEvent(new Event('auth-change'));
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="auth-header">
        <div className="logo-container">
          <div className="logo-icon">🥗</div>
          <h1>NutriVision</h1>
        </div>
        <p className="subtitle">
          {isForgot
            ? 'Reset your password to regain access'
            : isLogin
            ? 'Welcome back! Ready to track?'
            : 'Start your health journey today'}
        </p>
      </div>

      <div className="auth-card animate-scale-in">
        <div className="auth-tabs">
          <button 
            className={`tab-btn ${isLogin && !isForgot ? 'active' : ''}`}
            onClick={() => handleTabSwitch(true)}
          >
            Login
          </button>
          <button 
            className={`tab-btn ${!isLogin && !isForgot ? 'active' : ''}`}
            onClick={() => handleTabSwitch(false)}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form stagger">
          {!isLogin && !isForgot && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required={!isLogin && !isForgot}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <div className="label-row">
              <label>{isForgot ? 'New Password' : 'Password'}</label>
              {isLogin && !isForgot && (
                <button
                  type="button"
                  className="forgot-password-link"
                  onClick={() => {
                    setIsForgot(true);
                    setError('');
                    setSuccessMsg('');
                  }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {(!isLogin || isForgot) && (
            <div className="form-group">
              <label>{isForgot ? 'Confirm New Password' : 'Confirm Password'}</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {successMsg && <div className="success-message">{successMsg}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <span className="loader"></span>
            ) : isForgot ? (
              'Reset Password'
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isForgot ? (
            <p>
              Remember your password?{' '}
              <span onClick={() => handleTabSwitch(true)}>
                Back to Login
              </span>
            </p>
          ) : (
            <p>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => handleTabSwitch(!isLogin)}>
                {isLogin ? 'Sign Up' : 'Login'}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
