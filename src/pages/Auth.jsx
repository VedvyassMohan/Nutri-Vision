import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Send Email, 2: Enter Code & Password, 3: Success
  const [otpCode, setOtpCode] = useState('');
  const [sentCodePreview, setSentCodePreview] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
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

  // Resend code countdown timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

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
    setForgotStep(1);
    setOtpCode('');
    setSentCodePreview('');
    setError('');
    setSuccessMsg('');
  };

  const handleSendResetEmail = async (e) => {
    if (e) e.preventDefault();
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authService.sendPasswordResetEmail(formData.email);
      setSentCodePreview(res.code);
      setForgotStep(2);
      setResendCountdown(60);
      setSuccessMsg(`Reset code sent to ${formData.email}!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit verification code sent to your email');
      return;
    }
    if (!formData.password) {
      setError('Please enter a new password');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authService.resetPasswordWithCode(formData.email, otpCode, formData.password);
      setForgotStep(3);
      setSuccessMsg('Your password has been successfully reset!');
      setTimeout(() => {
        setIsForgot(false);
        setIsLogin(true);
        setForgotStep(1);
        setOtpCode('');
        setSentCodePreview('');
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      }, 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isLogin) {
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
            ? forgotStep === 3
              ? 'Password reset complete'
              : forgotStep === 2
              ? 'Enter the code sent to your email'
              : 'Reset your password via email'
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

        {/* ─── FORGOT PASSWORD: STEP 1 (Send Email) ─── */}
        {isForgot && forgotStep === 1 && (
          <form onSubmit={handleSendResetEmail} className="auth-form stagger">
            <div className="forgot-header-info">
              <h3>Forgot Password</h3>
              <p>Enter your registered email address and we'll send you a 6-digit verification code to reset your password.</p>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* ─── FORGOT PASSWORD: STEP 2 (Verify OTP & Set Password) ─── */}
        {isForgot && forgotStep === 2 && (
          <form onSubmit={handleVerifyAndReset} className="auth-form stagger">
            <div className="email-dispatched-banner">
              <div className="email-dispatched-icon">📩</div>
              <div className="email-dispatched-text">
                <strong>Check your inbox</strong>
                <span>We sent a 6-digit code to <b>{formData.email}</b></span>
              </div>
            </div>

            {sentCodePreview && (
              <div className="demo-code-chip">
                <span>Demo Code: <strong>{sentCodePreview}</strong></span>
                <button
                  type="button"
                  className="copy-chip-btn"
                  onClick={() => setOtpCode(sentCodePreview)}
                >
                  Auto-Fill
                </button>
              </div>
            )}

            <div className="form-group">
              <label>6-Digit Verification Code</label>
              <input
                type="text"
                maxLength="6"
                placeholder="123456"
                className="otp-input"
                value={otpCode}
                onChange={(e) => {
                  setOtpCode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="password"
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter new password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="resend-row">
              {resendCountdown > 0 ? (
                <span className="resend-timer">Resend code in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleSendResetEmail}
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMsg && <div className="success-message">{successMsg}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? <span className="loader"></span> : 'Verify & Reset Password'}
            </button>
          </form>
        )}

        {/* ─── FORGOT PASSWORD: STEP 3 (Success) ─── */}
        {isForgot && forgotStep === 3 && (
          <div className="forgot-success-card animate-scale-in">
            <div className="success-icon-badge">✅</div>
            <h3>Password Reset!</h3>
            <p>Your password has been successfully updated. Redirecting you to sign in...</p>
            <button
              type="button"
              className="submit-btn"
              onClick={() => handleTabSwitch(true)}
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* ─── STANDARD LOGIN / SIGNUP FORM ─── */}
        {!isForgot && (
          <form onSubmit={handleSubmit} className="auth-form stagger">
            {!isLogin && (
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required={!isLogin}
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
                <label>Password</label>
                {isLogin && (
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => {
                      setIsForgot(true);
                      setForgotStep(1);
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

            {!isLogin && (
              <div className="form-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!isLogin}
                />
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="loader"></span>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        )}

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
