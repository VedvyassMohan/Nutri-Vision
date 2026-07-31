import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { dbService } from '../services/dbService'
import AddMeal from '../components/AddMeal'
import './Meals.css'

function MacroBar({ label, value, goal, unit, color }) {
  const roundedVal = Math.round((value || 0) * 100) / 100
  const pct = Math.min((roundedVal / goal) * 100, 100)
  return (
    <div className="macro-item">
      <div className="macro-top">
        <span className="macro-label">{label}</span>
        <span className="macro-val">{roundedVal}/{goal}{unit}</span>
      </div>
      <div className="macro-track">
        <div className="macro-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Meals({ user: propUser }) {
  const [user, setUser] = useState(propUser || authService.getCurrentUser())
  const [meals, setMeals] = useState([])
  const [macros, setMacros] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  const [isAddOpen, setIsAddOpen] = useState(false)

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

  // Load meals from dbService on mount
  useEffect(() => {
    if (!user?.id) return
    refreshData()
  }, [user?.id])

  const refreshData = () => {
    setMeals(dbService.getTodaysMeals(user.id))
    setMacros(dbService.getTodaysMacros(user.id))
  }

  const handleAddMeal = (newMeal) => {
    dbService.addMeal(user.id, newMeal)
    refreshData()
    window.dispatchEvent(new Event('db-change'))
  }

  const handleRemoveMeal = (id) => {
    dbService.removeMeal(user.id, id)
    refreshData()
    window.dispatchEvent(new Event('db-change'))
  }

  const MACROS = [
    { label: 'Protein', value: macros.protein, goal: user?.proteinGoal || 150, unit: 'g', color: '#0abab5' },
    { label: 'Carbs', value: macros.carbs, goal: user?.carbsGoal || 200, unit: 'g', color: '#4a90d9' },
    { label: 'Fat', value: macros.fat, goal: user?.fatGoal || 65, unit: 'g', color: '#ff6b35' },
  ]

  return (
    <div className="meals-page stagger">
      <header className="meals-header animate-fade-in">
        <div>
          <h1>Today's Meals</h1>
          <p className="meals-sub-text">Track your daily nutrition and macro breakdown</p>
        </div>
        <button 
          className="btn-add-meal-header" 
          id="add-meal-btn" 
          aria-label="Add meal"
          onClick={() => setIsAddOpen(true)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Meal</span>
        </button>

      </header>

      {/* Macro Overview */}
      <section className="card macro-card animate-fade-in" id="macro-overview">
        <h2 className="card-title">Macro Overview</h2>
        {MACROS.map(m => (
          <MacroBar key={m.label} {...m} />
        ))}
      </section>

      {/* Meal List */}
      <section className="meal-list animate-fade-in" id="meal-list">
        {meals.length === 0 && (
          <div className="empty-meals">
            <span className="empty-icon">🍽️</span>
            <p>No meals logged today</p>
            <p className="empty-sub">Tap + Add Meal to log your first dish</p>
          </div>
        )}
        {meals.map((meal, i) => (
          <div className="meal-item" key={meal.id} style={{ animationDelay: `${i * 0.08}s` }}>
            <button 
              className="remove-meal-btn" 
              onClick={() => handleRemoveMeal(meal.id)}
              aria-label="Remove meal"
            >
              &times;
            </button>
            <div className="meal-image-container">
              {meal.image ? (
                <img src={meal.image} alt={meal.name} className="meal-img-thumb" />
              ) : (
                <div className="meal-emoji">{meal.emoji}</div>
              )}
            </div>
            <div className="meal-details">
              <h3>{meal.name}</h3>
              <span className="meal-time">{meal.time}</span>
            </div>
            <div className="meal-cals">
              <span className="meal-cal-num">{meal.cal}</span>
              <span className="meal-cal-unit">kcal</span>
            </div>
          </div>
        ))}
      </section>


      {/* Centered Add Meal Circular Button (APK Mobile) */}
      <div className="center-add-meal-wrap animate-fade-in">
        <button 
          className="btn-add-meal-circle" 
          onClick={() => setIsAddOpen(true)}
          aria-label="Add meal"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>


      {/* Add Meal Overlay */}
      <AddMeal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onAdd={handleAddMeal}
        userId={user?.id}
      />
    </div>
  )
}
