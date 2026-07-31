import { useState, useRef, useEffect } from 'react'
import foodDataset from '../data/foodDataset.json'
import { analyzeImageWithModel, parseFoodDescription, parseDescriptionAdditions, MODEL_ID } from '../services/nutritionVisionService'
import './AddMeal.css'

export default function AddMeal({ isOpen, onClose, onAdd }) {
  const [description, setDescription] = useState('')
  const [previewImage, setPreviewImage] = useState(null)
  const [stream, setStream] = useState(null)
  
  // Vision AI model state
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiVisionResult, setAiVisionResult] = useState(null)

  // Recipe Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [servingMultiplier, setServingMultiplier] = useState(1)

  // Live parsed description additions & weight
  const [descriptionAdditions, setDescriptionAdditions] = useState({
    additions: [],
    extraCal: 0,
    extraProtein: 0,
    extraCarbs: 0,
    extraFat: 0
  })
  const [parsedWeight, setParsedWeight] = useState(null)

  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const searchContainerRef = useRef(null)

  useEffect(() => {
    if (isOpen && !previewImage) {
      startCamera()
    } else if (!isOpen) {
      stopCamera()
    }
    return () => stopCamera()
  }, [isOpen, previewImage])

  // Handle clicking outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.removeEventListener('mousedown', handleClickOutside)
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Live description parser for dish auto-detection, gram weights (e.g. 700g), & extra points
  useEffect(() => {
    if (!description.trim()) {
      setDescriptionAdditions({ additions: [], extraCal: 0, extraProtein: 0, extraCarbs: 0, extraFat: 0 })
      setParsedWeight(null)
      return
    }

    try {
      const parsed = parseFoodDescription(description)
      if (!parsed) return

      // Guard: only use if correct structure returned
      if (parsed.textAdditions) {
        setDescriptionAdditions(parsed.textAdditions)
      }
      setParsedWeight(parsed.weightGram || null)

      if (parsed.detectedRecipe) {
        setSelectedRecipe(parsed.detectedRecipe)
        setSearchQuery(parsed.detectedRecipe.name)
        if (parsed.multiplier) {
          setServingMultiplier(parsed.multiplier)
        }
      }
    } catch (err) {
      console.warn('Description parse error (safe):', err)
      // Don't crash — just reset additions safely
      setDescriptionAdditions({ additions: [], extraCal: 0, extraProtein: 0, extraCarbs: 0, extraFat: 0 })
    }
  }, [description])


  // Process captured/uploaded image through Hugging Face Vision LoRA model
  const processVisionModel = async (imageDataUrl) => {
    setAiAnalyzing(true)
    setAiVisionResult(null)
    
    try {
      const result = await analyzeImageWithModel(imageDataUrl)
      setAiVisionResult(result)
      
      // Automatically select recipe & update search query when AI detects valid food
      if (result.isValidFood) {
        const detectedRecipe = {
          name: result.foodName,
          cal: result.cal,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          emoji: result.emoji
        }
        setSelectedRecipe(detectedRecipe)
        setSearchQuery(result.foodName)
        setServingMultiplier(1)
      }
    } catch (err) {
      console.error("Vision AI analysis error:", err)
      setAiVisionResult({ isValidFood: false, errorMessage: 'Image lacks vital details' })
    } finally {
      setAiAnalyzing(false)
    }
  }

  // Filter food dataset as user types
  const handleSearchChange = (e) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim().length >= 1) {
      const q = query.toLowerCase()
      const matches = foodDataset
        .filter(item => item.name.toLowerCase().includes(q))
        .slice(0, 10)
      setSearchResults(matches)
      setShowDropdown(true)
    } else {
      setSearchResults([])
      setShowDropdown(false)
    }
  }

  const handleSelectRecipe = (recipe) => {
    setSelectedRecipe(recipe)
    setSearchQuery(recipe.name)
    setShowDropdown(false)
    setServingMultiplier(1)
  }

  const handleClearSelectedRecipe = () => {
    setSelectedRecipe(null)
    setSearchQuery('')
    setServingMultiplier(1)
    setAiVisionResult(null)
  }

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err) {
      console.error("Error accessing camera:", err)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
  }

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg')
      setPreviewImage(dataUrl)
      stopCamera()
      
      // Trigger Vision Model Analysis
      processVisionModel(dataUrl)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const dataUrl = reader.result
        setPreviewImage(dataUrl)
        stopCamera()
        
        // Trigger Vision Model Analysis
        processVisionModel(dataUrl)
      }
      reader.readAsDataURL(file)
    }
  }

  // Calculate Base + Extra Points from description
  const baseCal = selectedRecipe ? Math.round(selectedRecipe.cal * servingMultiplier) : (aiVisionResult?.isValidFood ? Math.round(aiVisionResult.cal * servingMultiplier) : 0)
  const baseProtein = selectedRecipe ? (selectedRecipe.protein * servingMultiplier) : (aiVisionResult?.isValidFood ? aiVisionResult.protein * servingMultiplier : 0)
  const baseCarbs = selectedRecipe ? (selectedRecipe.carbs * servingMultiplier) : (aiVisionResult?.isValidFood ? aiVisionResult.carbs * servingMultiplier : 0)
  const baseFat = selectedRecipe ? (selectedRecipe.fat * servingMultiplier) : (aiVisionResult?.isValidFood ? aiVisionResult.fat * servingMultiplier : 0)

  const finalCal = Math.max(0, baseCal + descriptionAdditions.extraCal)
  const finalProtein = Math.max(0, Math.round((baseProtein + descriptionAdditions.extraProtein) * 100) / 100)
  const finalCarbs = Math.max(0, Math.round((baseCarbs + descriptionAdditions.extraCarbs) * 100) / 100)
  const finalFat = Math.max(0, Math.round((baseFat + descriptionAdditions.extraFat) * 100) / 100)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!description && !selectedRecipe && !previewImage && !aiVisionResult?.isValidFood) return

    let finalName = selectedRecipe?.name || (aiVisionResult?.isValidFood ? aiVisionResult.foodName : null) || description || 'Custom Meal'
    let finalEmoji = selectedRecipe?.emoji || (aiVisionResult?.isValidFood ? aiVisionResult.emoji : null) || '🍽️'

    if (description && selectedRecipe && description !== selectedRecipe.name) {
      finalName = `${selectedRecipe.name} (${description})`
    }

    onAdd({
      id: Date.now(),
      name: finalName,
      cal: finalCal, 
      protein: finalProtein,
      carbs: finalCarbs,
      fat: finalFat,
      time: 'Just Now',
      emoji: finalEmoji,
      image: previewImage
    })
    
    setDescription('')
    setSearchQuery('')
    setSelectedRecipe(null)
    setPreviewImage(null)
    setAiVisionResult(null)
    setServingMultiplier(1)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="add-meal-overlay animate-fade-in">
      <div className="add-meal-container animate-slide-up">
        <header className="add-meal-header">
          <div className="sheet-handle-bar"></div>
          <div className="header-title-row">
            <h1>Add Meal</h1>
            <button className="close-meal-btn" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </header>


        <div className="add-meal-scroll-body">
          <div className="add-meal-content">
            {/* Camera Preview */}
            <div className="camera-preview-box">

            <div className="status-badge left">
              <span className="rec-dot"></span>
            </div>
            <div className="status-badge right">{stream ? 'Live' : 'Ready'}</div>
            
            <div className="camera-view-container">
              {previewImage ? (
                <img src={previewImage} alt="Preview" className="meal-preview-img" />
              ) : (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="camera-video"
                />
              )}
              
              {!stream && !previewImage && (
                <div className="camera-placeholder-content">
                  <div className="cam-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p>Initializing camera...</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          <button 
            className="btn-capture" 
            onClick={previewImage ? () => { setPreviewImage(null); setAiVisionResult(null); } : handleCapture}
          >
            <span className="btn-icon">📷</span> 
            {previewImage ? 'Retake Photo' : 'Capture & Analyze with Vision AI'}
          </button>
          
          <button className="btn-upload" onClick={() => fileInputRef.current.click()}>
            <span className="btn-icon">🖼️</span> Upload photo from gallery
          </button>

          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            onChange={handleFileChange}
          />

          {/* AI Vision Model Scanning / Result Banner */}
          {aiAnalyzing && (
            <div className="ai-vision-banner analyzing">
              <div className="ai-spinner"></div>
              <div className="ai-banner-text">
                <strong>Analyzing Image...</strong>
                <span>Running model <code>{MODEL_ID}</code></span>
              </div>
            </div>
          )}

          {aiVisionResult && !aiAnalyzing && (
            aiVisionResult.isValidFood ? (
              <div className="ai-vision-banner detected">
                <div className="ai-badge-icon">🤖</div>
                <div className="ai-banner-text">
                  <div className="ai-model-tag">Model: {MODEL_ID}</div>
                  <strong>Detected: {aiVisionResult.emoji} {aiVisionResult.foodName}</strong>
                  <span>Confidence: {aiVisionResult.confidence}% • Base: {aiVisionResult.cal} kcal</span>
                </div>
              </div>
            ) : (
              <div className="ai-vision-banner rejected">
                <div className="ai-badge-icon">⚠️</div>
                <div className="ai-banner-text">
                  <div className="ai-model-tag error">Notice</div>
                  <strong>Image lacks vital details</strong>
                  <span>Could not detect food in this photo. Please capture a clear food photo or select a recipe below.</span>
                </div>
              </div>
            )
          )}

          {/* Description Card */}
          <div className="description-card card">
            <div className="desc-title">
              <span className="sparkle-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                  <path d="M5 3v4" />
                  <path d="M19 17v4" />
                  <path d="M3 5h4" />
                  <path d="M17 19h4" />
                </svg>
              </span>
              <h3>Describe or edit your meal</h3>
            </div>
            <textarea 
              placeholder="E.g., with 2 extra eggs, + 1 cup rice, less oil, extra cheese..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="meal-textarea"
            />

            {/* Display parsed additions live */}
            {descriptionAdditions.additions.length > 0 && (
              <div className="parsed-additions-box">
                <div className="pab-title">⚡ Added Points from Description:</div>
                <div className="pab-chips">
                  {descriptionAdditions.additions.map((item, idx) => (
                    <span key={idx} className={`pab-chip ${item.cal < 0 ? 'negative' : ''}`}>
                      {item.item} ({item.cal >= 0 ? `+${item.cal}` : item.cal} kcal)
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Recipe Search & Dropdown */}
          <div className="recipe-search-card card" ref={searchContainerRef}>
            <div className="desc-title">
              <span className="sparkle-icon">🔍</span>
              <h3>Search Food Dataset</h3>
            </div>
            <div className="search-input-wrapper">
              <input 
                type="text"
                placeholder="Search recipes (e.g. Chicken, Pizza, Omelet...)"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery.trim().length >= 1 && setShowDropdown(true)}
                className="recipe-search-input"
              />
              {searchQuery && (
                <button type="button" className="clear-search-btn" onClick={handleClearSelectedRecipe}>
                  &times;
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            {showDropdown && searchResults.length > 0 && (
              <div className="recipe-dropdown-menu">
                {searchResults.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="recipe-dropdown-item"
                    onClick={() => handleSelectRecipe(item)}
                  >
                    <span className="rd-emoji">{item.emoji}</span>
                    <div className="rd-info">
                      <span className="rd-name">{item.name}</span>
                      <span className="rd-macros">
                        {item.cal} kcal • P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Recipe Nutrition Card */}
            {selectedRecipe && (
              <div className="selected-recipe-card">
                <div className="src-header">
                  <span className="src-name">{selectedRecipe.emoji} {selectedRecipe.name}</span>
                  <span className="src-cal">{Math.round(selectedRecipe.cal * servingMultiplier)} kcal</span>
                </div>

                <div className="src-macros-row">
                  <div className="src-macro">
                    <span className="sm-label">Protein</span>
                    <span className="sm-val">{(selectedRecipe.protein * servingMultiplier).toFixed(1)}g</span>
                  </div>
                  <div className="src-macro">
                    <span className="sm-label">Carbs</span>
                    <span className="sm-val">{(selectedRecipe.carbs * servingMultiplier).toFixed(1)}g</span>
                  </div>
                  <div className="src-macro">
                    <span className="sm-label">Fat</span>
                    <span className="sm-val">{(selectedRecipe.fat * servingMultiplier).toFixed(1)}g</span>
                  </div>
                </div>

                {/* Serving multiplier selector */}
                <div className="portion-selector">
                  <span className="portion-label">Portion:</span>
                  {[0.5, 1, 1.5, 2].map(multiplier => (
                    <button
                      key={multiplier}
                      type="button"
                      className={`portion-btn ${servingMultiplier === multiplier ? 'active' : ''}`}
                      onClick={() => setServingMultiplier(multiplier)}
                    >
                      {multiplier}x
                    </button>
                  ))}
                  {![0.5, 1, 1.5, 2].includes(servingMultiplier) && (
                    <button type="button" className="portion-btn active">
                      {parsedWeight ? `${parsedWeight}g` : `${servingMultiplier}x`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Final Combined Calculation Summary Card */}
          {(baseCal > 0 || descriptionAdditions.extraCal !== 0) && (
            <div className="combined-summary-card card">
              <div className="csc-header">
                <h3>Total Meal Calculation</h3>
                <span className="csc-total-cal">{finalCal} kcal</span>
              </div>

              <div className="csc-breakdown">
                {baseCal > 0 && (
                  <div className="csc-row">
                    <span>Base ({selectedRecipe?.name || aiVisionResult?.foodName || 'Meal'}):</span>
                    <strong>+{baseCal} kcal</strong>
                  </div>
                )}
                {descriptionAdditions.extraCal !== 0 && (
                  <div className="csc-row highlight">
                    <span>Description Additions:</span>
                    <strong>{descriptionAdditions.extraCal > 0 ? `+${descriptionAdditions.extraCal}` : descriptionAdditions.extraCal} kcal</strong>
                  </div>
                )}
              </div>

              <div className="csc-macros-grid">
                <div className="csc-macro-item">
                  <span className="cmi-val">{finalProtein}g</span>
                  <span className="cmi-label">Protein</span>
                </div>
                <div className="csc-macro-item">
                  <span className="cmi-val">{finalCarbs}g</span>
                  <span className="cmi-label">Carbs</span>
                </div>
                <div className="csc-macro-item">
                  <span className="cmi-val">{finalFat}g</span>
                  <span className="cmi-label">Fats</span>
                </div>
              </div>
            </div>
          )}

          <button className="btn-add-final" onClick={handleSubmit}>
            Add Meal ({finalCal} kcal)
          </button>
        </div>
      </div>
    </div>
  </div>
)

}
