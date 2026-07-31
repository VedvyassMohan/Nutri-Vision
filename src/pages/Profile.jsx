import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../services/authService'
import { dbService } from '../services/dbService'
import './Profile.css'

export default function Profile({ user: propUser }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(propUser || authService.getCurrentUser());

  const [personalDetails, setPersonalDetails] = useState({
    height: user?.height || '170',
    weight: user?.weight || '70',
    age: user?.age || '25',
    gender: user?.gender || 'Male',
    goal: user?.goal || 'Maintain Weight'
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: user?.name || '',
    photo: user?.photo || ''
  });

  const [toggles, setToggles] = useState({
    darkMode: false,
    notifications: true,
    help: false,
    privacy: false
  });

  // Keep user & details in sync with auth-change events without interrupting active input typing
  useEffect(() => {
    const handleAuthChange = () => {
      const latestUser = authService.getCurrentUser();
      setUser(latestUser);

      const activeEl = document.activeElement;
      const isEditingDetails = activeEl && activeEl.classList.contains('detail-input');
      
      if (latestUser && !isEditingDetails) {
        setPersonalDetails({
          height: latestUser.height !== undefined ? String(latestUser.height) : '170',
          weight: latestUser.weight !== undefined ? String(latestUser.weight) : '70',
          age: latestUser.age !== undefined ? String(latestUser.age) : '25',
          gender: latestUser.gender || 'Male',
          goal: latestUser.goal || 'Maintain Weight'
        });
      }
    };

    if (propUser) {
      setUser(propUser);
    }
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [propUser]);

  // Live stats from dbService
  const stats = user?.id ? dbService.getStats(user.id) : { avgCalories: 0, bestStreak: 0, totalMealsLogged: 0 };

  const STATS = [
    { label: 'Avg Calories', value: stats.avgCalories > 0 ? stats.avgCalories.toLocaleString() : '0', icon: '🔥' },
    { label: 'Best Streak', value: `${stats.bestStreak} day${stats.bestStreak !== 1 ? 's' : ''}`, icon: '⚡' },
    { label: 'Meals Logged', value: stats.totalMealsLogged.toString(), icon: '🍽️' },
  ];

  const handleDetailChange = (e) => {
    const { name, value } = e.target;
    setPersonalDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlurOrSave = (overrideDetails = null) => {
    const details = overrideDetails || personalDetails;
    const h = parseFloat(details.height);
    const w = parseFloat(details.weight);
    const a = parseFloat(details.age);

    if (!isNaN(h) && h > 0 && !isNaN(w) && w > 0 && !isNaN(a) && a > 0) {
      authService.updateUser(details);
      authService.calculateAndSaveGoals();
      window.dispatchEvent(new Event('auth-change'));
    }
  };

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData({ ...editFormData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
    setShowPhotoOptions(false);
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    authService.updateUser({
      name: editFormData.name,
      photo: editFormData.photo
    });
    setIsEditModalOpen(false);
    window.dispatchEvent(new Event('auth-change'));
  };

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleCalculate = () => {
    authService.updateUser(personalDetails);
    authService.calculateAndSaveGoals();
    window.dispatchEvent(new Event('auth-change'));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogout = () => {
    authService.logout();
    window.dispatchEvent(new Event('auth-change'));
    navigate('/');
  };

  if (!user) return null;

  const heightVal = parseFloat(user?.height || personalDetails.height || 170);
  const heightFactorRatio = (heightVal / 170).toFixed(2);

  const SETTINGS_OPTIONS = [
    { key: 'darkMode', label: 'Dark Mode', icon: '🌙', type: 'toggle' },
    { key: 'notifications', label: 'Notifications', icon: '🔔', type: 'toggle' },
    { key: 'help', label: 'Help', icon: '❓', type: 'link' },
    { key: 'privacy', label: 'Privacy & Policy', icon: '🛡️', type: 'link' },
  ];

  return (
    <div className="profile-page stagger">
      {/* Hidden Inputs for Photo */}
      <input 
        type="file" 
        accept="image/*" 
        style={{ display: 'none' }} 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        accept="image/*" 
        capture="user"
        style={{ display: 'none' }} 
        ref={cameraInputRef}
        onChange={handleFileChange}
      />

      {/* Hero Profile Header */}
      <div className="profile-header animate-fade-in" id="profile-header">
        <div className="profile-header-left">
          <div className="profile-avatar-lg">
            {user.photo ? (
              <img src={user.photo} alt="Profile" className="avatar-img" />
            ) : (
              user.name ? user.name[0].toUpperCase() : 'U'
            )}
          </div>
          <div className="profile-user-info">
            <h1 className="profile-name">{user.name || 'User'}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>

        <button 
          className="edit-profile-btn" 
          id="edit-profile-btn"
          onClick={() => setIsEditModalOpen(true)}
        >
          Edit Profile
        </button>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale-in">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="edit-profile-form">
              {/* Avatar Section */}
              <div className="edit-avatar-section">
                <div className="avatar-preview-container">
                  <div className="profile-avatar-lg">
                    {editFormData.photo ? (
                      <img src={editFormData.photo} alt="Preview" className="avatar-img" />
                    ) : (
                      editFormData.name ? editFormData.name[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <button type="button" className="camera-badge" onClick={() => setShowPhotoOptions(!showPhotoOptions)}>
                    📸
                  </button>
                  
                  {showPhotoOptions && (
                    <div className="photo-options-popup animate-scale-in">
                      <div className="photo-option" onClick={() => cameraInputRef.current.click()}>
                        <span className="option-icon">📷</span>
                        <span>Camera</span>
                      </div>
                      <div className="photo-option" onClick={() => fileInputRef.current.click()}>
                        <span className="option-icon">🖼️</span>
                        <span>Gallery</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Display Name</label>
                <input 
                  type="text" 
                  className="modal-input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Stats Bar */}
      <section className="profile-stats-bar animate-fade-in" id="profile-stats">
        {STATS.map(s => (
          <div className="profile-stat-card" key={s.label}>
            <span className="ps-icon">{s.icon}</span>
            <div>
              <span className="ps-val">{s.value}</span>
              <span className="ps-label">{s.label}</span>
            </div>
          </div>
        ))}
      </section>

      {/* 2-Column Content Grid */}
      <div className="profile-content-grid">
        {/* Personal Details */}
        <section className="card details-card animate-fade-in" id="personal-details">
          <h2 className="card-title">Personal Details & Goals</h2>
          <div className="details-grid">
            <div className="detail-item">
              <label>Height (cm)</label>
              <input 
                type="number" 
                name="height"
                step="any"
                placeholder="e.g. 170"
                className="detail-input" 
                value={personalDetails.height}
                onChange={handleDetailChange}
                onBlur={() => handleBlurOrSave()}
              />
            </div>
            <div className="detail-item">
              <label>Weight (kg)</label>
              <input 
                type="number" 
                name="weight"
                step="any"
                placeholder="e.g. 70"
                className="detail-input" 
                value={personalDetails.weight}
                onChange={handleDetailChange}
                onBlur={() => handleBlurOrSave()}
              />
            </div>
            <div className="detail-item">
              <label>Age</label>
              <input 
                type="number" 
                name="age"
                placeholder="e.g. 25"
                className="detail-input" 
                value={personalDetails.age}
                onChange={handleDetailChange}
                onBlur={() => handleBlurOrSave()}
              />
            </div>
            <div className="detail-item">
              <label>Gender</label>
              <select 
                name="gender"
                className="detail-input select" 
                value={personalDetails.gender}
                onChange={(e) => {
                  const nextDetails = { ...personalDetails, gender: e.target.value };
                  setPersonalDetails(nextDetails);
                  handleBlurOrSave(nextDetails);
                }}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="detail-item full-width">
              <label>Goal</label>
              <select 
                name="goal"
                className="detail-input select" 
                value={personalDetails.goal}
                onChange={(e) => {
                  const nextDetails = { ...personalDetails, goal: e.target.value };
                  setPersonalDetails(nextDetails);
                  handleBlurOrSave(nextDetails);
                }}
              >
                <option value="Maintain Weight">Maintain Weight</option>
                <option value="Lose Weight (-300 kcal)">Lose Weight (-300 kcal)</option>
                <option value="Gain Muscle (+300 kcal)">Gain Muscle (+300 kcal)</option>
              </select>
            </div>
          </div>

          {/* Calculated Goals Summary & Height Factor Box */}
          <div className="calculated-targets-box">
            <div className="target-box-header">
              <span className="target-box-title">Calculated Targets</span>
              <span className="height-factor-badge" title="Height scaling multiplier relative to 170cm standard">
                📐 Height Factor: {heightFactorRatio}x ({heightVal} cm)
              </span>
            </div>
            <div className="target-items-grid">
              <div className="target-pill">
                <span className="tp-label">Calories</span>
                <span className="tp-val">{user?.calorieGoal || 2000} kcal</span>
              </div>
              <div className="target-pill">
                <span className="tp-label">Protein</span>
                <span className="tp-val">{user?.proteinGoal || 100}g</span>
              </div>
              <div className="target-pill">
                <span className="tp-label">Carbs</span>
                <span className="tp-val">{user?.carbsGoal || 200}g</span>
              </div>
              <div className="target-pill">
                <span className="tp-label">Fat</span>
                <span className="tp-val">{user?.fatGoal || 65}g</span>
              </div>
            </div>
          </div>

          <button className={`modify-btn ${savedSuccess ? 'success' : ''}`} onClick={handleCalculate}>
            {savedSuccess ? 'Goals Updated! ✓' : 'Modify Goals'}
          </button>
        </section>

        {/* Right Column: Settings & Logout */}
        <div className="profile-right-column">
          <section className="card settings-card animate-fade-in" id="profile-settings">
            <h2 className="card-title">Settings & Preferences</h2>
            {SETTINGS_OPTIONS.map(s => (
              <div className="setting-row" key={s.label}>
                <div className="setting-left">
                  <span className="setting-icon">{s.icon}</span>
                  <span className="setting-label">{s.label}</span>
                </div>
                {s.type === 'toggle' ? (
                  <button
                    className={`toggle ${s.key === 'darkMode' ? (user?.darkMode ? 'on' : '') : (toggles[s.key] ? 'on' : '')}`}
                    onClick={() => {
                      if (s.key === 'darkMode') {
                        const newDarkMode = !user?.darkMode;
                        authService.updateUser({ darkMode: newDarkMode });
                        window.dispatchEvent(new Event('auth-change'));
                      } else {
                        setToggles({ ...toggles, [s.key]: !toggles[s.key] });
                      }
                    }}
                    aria-label={`Toggle ${s.label}`}
                  >
                    <div className="toggle-knob" />
                  </button>
                ) : (
                  <span className="setting-arrow">&rsaquo;</span>
                )}
              </div>
            ))}
          </section>

          <button className="logout-btn animate-fade-in" id="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  )
}
