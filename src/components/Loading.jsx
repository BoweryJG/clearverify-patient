import React, { useState, useEffect } from 'react'

const LOADING_STEPS = [
  "Connecting to your insurance...",
  "Checking your benefits...",
  "Calculating your costs...",
  "Almost done..."
]

function Loading({ message = null }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % LOADING_STEPS.length)
    }, 750)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100
        return prev + 2
      })
    }, 60)

    return () => {
      clearInterval(stepInterval)
      clearInterval(progressInterval)
    }
  }, [])

  return (
    <div className="loading slide-up">
      <div className="spinner"></div>
      
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>
        {message || LOADING_STEPS[currentStep]}
      </h3>
      
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        This usually takes about 30 seconds
      </p>

      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
        🔒 Your data is encrypted and will be deleted immediately
      </div>
    </div>
  )
}

export default Loading