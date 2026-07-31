import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { dbService } from '../services/dbService'
import './Home.css'

function CalorieRing({ consumed, goal }) {
  const pct = Math.min(consumed / goal, 1)
  const left = goal - consumed
  const r = 80
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="calorie-ring-wrap">
      <svg width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#e8ecf0" strokeWidth="12" />
        <circle
          cx="100" cy="100" r={r} fill="none"
          stroke="url(#tealGrad)" strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          className="calorie-progress"
        />
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0abab5" />
            <stop offset="100%" stopColor="#06d6a0" />
          </linearGradient>
        </defs>
      </svg>
      <div className="calorie-center">
        <span className="calorie-num">{consumed}</span>
        <span className="calorie-goal">/ {goal} kcal</span>
        <span className="calorie-left">{left} left</span>
      </div>
    </div>
  )
}

export default function Home({ user: propUser }) {
  const [user, setUser] = useState(propUser || authService.getCurrentUser())

  // Live data from dbService
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, weekDays: [] })
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [waterData, setWaterData] = useState({ glasses: 0, goal: 8, targetLiters: 2.0, timerEnabled: true, intervalMinutes: 25, completedCycles: 0 })

  // Water Reminder Timer state
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const handleAuthChange = () => {
      setUser(authService.getCurrentUser())
    }
    if (propUser) {
      setUser(propUser)
    }
    window.addEventListener('auth-change', handleAuthChange)
    return () => window.removeEventListener('auth-change', handleAuthChange)
  }, [propUser])

  useEffect(() => {
    if (!user?.id) return

    // Record login
    dbService.recordLogin(user.id)

    // Load live data
    setStreakData(dbService.getStreak(user.id))
    setMacros(dbService.getTodaysMacros(user.id))
    const w = dbService.getWater(user.id)
    setWaterData(w)
    setSecondsLeft((w.intervalMinutes || 25) * 60)

    const refresh = () => {
      setStreakData(dbService.getStreak(user.id))
      setMacros(dbService.getTodaysMacros(user.id))
      const updatedW = dbService.getWater(user.id)
      setWaterData(updatedW)
    }
    window.addEventListener('db-change', refresh)
    return () => window.removeEventListener('db-change', refresh)
  }, [user?.id])

  // Hydration Audio Synthesizer Chime
  const playWaterChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18) // A5 water drop synth tone

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.warn("Water chime audio note:", e)
    }
  }

  // Water calculations
  const isTimerOn = waterData.timerEnabled !== false
  const intervalMins = waterData.intervalMinutes || 25
  const targetLiters = waterData.targetLiters || (waterData.goal ? waterData.goal * 0.25 : 2.0)
  const goalGlasses = Math.round(targetLiters * 4)
  const currentGlasses = waterData.glasses || 0
  const isCycleCompleted = currentGlasses >= goalGlasses

  // Interval Countdown Effect
  useEffect(() => {
    if (!isTimerOn) return

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          playWaterChime()
          setToastMessage('💧 Hydration Break! Time to drink a glass of water.')
          setTimeout(() => setToastMessage(''), 6000)
          return intervalMins * 60
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isTimerOn, intervalMins])

  // Water Handlers
  const handleTargetSliderChange = (e) => {
    const liters = parseFloat(e.target.value)
    const glasses = Math.round(liters * 4)
    dbService.setWater(user.id, { targetLiters: liters, goal: glasses })
    setWaterData(dbService.getWater(user.id))
    window.dispatchEvent(new Event('db-change'))
  }

  const handleToggleTimer = () => {
    const nextState = !isTimerOn
    dbService.setWater(user.id, { timerEnabled: nextState })
    setWaterData(dbService.getWater(user.id))
    window.dispatchEvent(new Event('db-change'))
  }

  const handleIntervalChange = (mins) => {
    dbService.setWater(user.id, { intervalMinutes: mins })
    setWaterData(dbService.getWater(user.id))
    setSecondsLeft(mins * 60)
    window.dispatchEvent(new Event('db-change'))
  }

  const handleLogGlass = (delta = 1) => {
    dbService.logGlass(user.id, delta)
    const updated = dbService.getWater(user.id)
    setWaterData(updated)
    window.dispatchEvent(new Event('db-change'))

    if (updated.glasses >= goalGlasses && currentGlasses < goalGlasses) {
      playWaterChime()
      setToastMessage(`🎉 Daily Water Target Reached! (${targetLiters.toFixed(1)}L Logged) 🏆`)
      setTimeout(() => setToastMessage(''), 7000)
    }
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const displayName = user?.name ? user.name.split(' ')[0] : 'User'
  const initial = user?.name ? user.name[0].toUpperCase() : 'U'

  return (
    <div className="home-page stagger">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="water-toast-banner animate-fade-in">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}>&times;</button>
        </div>
      )}

      {/* Header */}
      <header className="home-header animate-fade-in">
        <div>
          <p className="greeting">Welcome back,</p>
          <h1 className="user-name">{displayName}!</h1>
        </div>
        <div className="avatar" id="user-avatar">
          {user?.photo ? (
            <img src={user.photo} alt="Avatar" className="avatar-img" />
          ) : (
            initial
          )}
        </div>
      </header>

      {/* Login Streak */}
      <section className="card streak-card animate-fade-in" id="login-streak">
        <div className="streak-header">
          <span className="streak-icon">📈</span>
          <h2>Login Streak</h2>
        </div>
        <div className="streak-dots">
          {streakData.weekDays.map((day) => (
            <div key={day.label} className="streak-day">
              <div className={`streak-dot ${day.active ? 'active' : ''}`}>
                {day.active && <div className="dot-inner" />}
              </div>
              <span className="streak-label">{day.label}</span>
            </div>
          ))}
        </div>
        <p className="streak-count">{streakData.currentStreak} day{streakData.currentStreak !== 1 ? 's' : ''} streak! 🔥</p>
      </section>

      {/* Today's Calories */}
      <section className="card calorie-card animate-fade-in" id="todays-calories">
        <h2 className="card-title">Today's Calories</h2>
        <CalorieRing consumed={macros.calories} goal={user?.calorieGoal || 2000} />
      </section>

      {/* Macro Summary Row */}
      <div className="macro-summary-row animate-fade-in">
        <div className="mini-macro">
          <span className="mm-label">PROTEIN</span>
          <span className="mm-val">{Math.round((macros.protein || 0) * 100) / 100}g / {user?.proteinGoal || 150}g</span>
        </div>
        <div className="mini-macro">
          <span className="mm-label">CARBS</span>
          <span className="mm-val">{Math.round((macros.carbs || 0) * 100) / 100}g / {user?.carbsGoal || 200}g</span>
        </div>
        <div className="mini-macro">
          <span className="mm-label">FAT</span>
          <span className="mm-val">{Math.round((macros.fat || 0) * 100) / 100}g / {user?.fatGoal || 65}g</span>
        </div>
      </div>

      {/* Full-Featured Water Cycle Tracker & Reminder */}
      <section className="water-card animate-fade-in" id="water-reminder">
        <div className="water-top">
          <div className="water-info">
            <span className="water-icon">💧</span>
            <div>
              <h3>Water Cycle & Reminder</h3>
              <span className="water-sub-text">
                {currentGlasses * 250}ml / {targetLiters * 1000}ml Target ({(currentGlasses * 0.25).toFixed(1)}L)
              </span>
            </div>
          </div>
          <button
            className={`toggle ${isTimerOn ? 'on' : ''}`}
            onClick={handleToggleTimer}
            id="water-toggle"
            aria-label="Toggle water reminder"
          >
            <div className="toggle-knob" />
          </button>
        </div>

        {/* Daily Target Slider (2.0L to 5.0L) */}
        <div className="water-target-slider-card">
          <div className="wts-header">
            <span className="wts-label">🎯 Set Daily Target:</span>
            <strong className="wts-val">{targetLiters.toFixed(1)} Liters ({goalGlasses} Glasses)</strong>
          </div>
          <div className="wts-slider-wrapper">
            <span className="wts-min">2.0L</span>
            <input
              type="range"
              min="2.0"
              max="5.0"
              step="0.5"
              value={targetLiters}
              onChange={handleTargetSliderChange}
              className="water-range-slider"
            />
            <span className="wts-max">5.0L</span>
          </div>
        </div>

        {/* Live Timer & Interval Selector */}
        <div className="water-timer-row">
          <div className="wt-countdown">
            <span className="wt-icon">⏱️</span>
            <span>{isTimerOn ? `Next drink in: ${formatTime(secondsLeft)}` : 'Timer Paused'}</span>
          </div>

          <select
            className="water-interval-select"
            value={intervalMins}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
          >
            <option value={15}>Every 15m</option>
            <option value={25}>Every 25m</option>
            <option value={45}>Every 45m</option>
            <option value={60}>Every 60m</option>
          </select>
        </div>

        {/* Interactive Glasses Matrix */}
        <div className="glass-matrix">
          {Array.from({ length: goalGlasses }).map((_, idx) => {
            const isFilled = idx < currentGlasses
            return (
              <button
                key={idx}
                type="button"
                className={`glass-btn ${isFilled ? 'filled' : 'empty'}`}
                onClick={() => {
                  const targetGlassCount = isFilled && idx === currentGlasses - 1 ? idx : idx + 1
                  const diff = targetGlassCount - currentGlasses
                  handleLogGlass(diff)
                }}
                title={`Glass ${idx + 1} (${(idx + 1) * 250}ml)`}
              >
                {isFilled ? '🥛' : '🫗'}
              </button>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="water-progress-wrap">
          <div className="water-progress-bar">
            <div
              className="water-progress-fill"
              style={{ width: `${Math.min(100, (currentGlasses / goalGlasses) * 100)}%` }}
            />
          </div>
          <div className="water-progress-labels">
            <span>{currentGlasses} / {goalGlasses} Glasses</span>
            <span>{Math.round((currentGlasses / goalGlasses) * 100)}% Completed</span>
          </div>
        </div>

        {/* Controls */}
        <div className="water-controls">
          <button className="btn-water-action decrement" onClick={() => handleLogGlass(-1)}>
            - Remove Glass
          </button>
          <button className="btn-water-action increment" onClick={() => handleLogGlass(1)}>
            + Log Glass (250ml)
          </button>
        </div>

        {/* Cycle Completion Badge */}
        {isCycleCompleted && (
          <div className="water-completion-badge">
            🏆 <strong>Daily Water Target Reached!</strong> ({(currentGlasses * 0.25).toFixed(1)} Liters logged today)
          </div>
        )}
      </section>

      {/* Quick Stats Row */}
      <div className="stats-row animate-fade-in" id="quick-stats">
        <div className="stat-card clickable" onClick={() => handleLogGlass(1)}>
          <span className="stat-icon water">💧</span>
          <span className="stat-num">{currentGlasses}</span>
          <span className="stat-label">Glasses (+1)</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon steps">📈</span>
          <span className="stat-num">{streakData.currentStreak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
        <div className="stat-card">
          <span className="stat-icon fire">🔥</span>
          <span className="stat-num">{Math.max(0, (user?.calorieGoal || 2000) - macros.calories)}</span>
          <span className="stat-label">kcal Left</span>
        </div>
      </div>
    </div>
  )
}
