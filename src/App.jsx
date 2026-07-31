import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, useRef, Component } from 'react'
import Home from './pages/Home.jsx'
import Meals from './pages/Meals.jsx'
import Profile from './pages/Profile.jsx'
import Auth from './pages/Auth.jsx'
import BottomNav from './components/BottomNav.jsx'
import { authService } from './services/authService'
import './App.css'

// ── Error Boundary: prevents white screen on unhandled component crashes ──
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { crashed: false }; }
  static getDerivedStateFromError() { return { crashed: true }; }
  componentDidCatch(err) { console.error('App crashed:', err); }
  render() {
    if (this.state.crashed) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          minHeight:'100vh', gap:'16px', padding:'24px', textAlign:'center' }}>
          <span style={{ fontSize:'3rem' }}>⚠️</span>
          <h2 style={{ fontSize:'1.2rem', fontWeight:700 }}>Something went wrong</h2>
          <p style={{ color:'#6b7280', fontSize:'0.9rem' }}>Please go back and try again.</p>
          <button onClick={() => this.setState({ crashed: false })}
            style={{ background:'#0abab5', color:'#fff', border:'none', padding:'10px 24px',
              borderRadius:'999px', fontWeight:700, cursor:'pointer', fontSize:'0.95rem' }}>
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}


const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/" replace />;
  return children;
};

// Animated page wrapper — fades in the new page smoothly on every route change
function AnimatedRoutes({ user }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('page-enter-done');
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (location.pathname !== displayLocation.pathname) {
      setTransitionStage('page-exit');
      const t = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('page-enter');
        const t2 = setTimeout(() => setTransitionStage('page-enter-done'), 220);
        return () => clearTimeout(t2);
      }, 120);
      return () => clearTimeout(t);
    }
  }, [location]);

  return (
    <div className={`page-transition ${transitionStage}`}>
      <Routes location={displayLocation}>
        <Route path="/" element={<Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Home user={user} /></ProtectedRoute>
        } />
        <Route path="/meals" element={
          <ProtectedRoute user={user}><Meals user={user} /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user}><Profile user={user} /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    // Detect Capacitor native platform — APK gets 'native', browser gets 'web'
    const isNative = !!(
      window.Capacitor?.isNativePlatform?.() ||
      window.Capacitor?.platform === 'android' ||
      window.Capacitor?.platform === 'ios' ||
      (window.Capacitor && window.Capacitor.getPlatform?.() !== 'web')
    );
    document.documentElement.setAttribute('data-platform', isNative ? 'native' : 'web');


    const checkAuth = () => {
      authService.calculateAndSaveGoals();
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      if (currentUser?.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-change', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);

  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="app-shell">
          <div className="page-content">
            <AnimatedRoutes user={user} />
          </div>
          {user && <BottomNav />}
        </div>
      </HashRouter>
    </ErrorBoundary>
  )
}

export default App
