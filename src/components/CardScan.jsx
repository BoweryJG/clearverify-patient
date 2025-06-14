import React, { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'

const INSURANCE_PROVIDERS = [
  { id: 'bcbs', name: 'Blue Cross Blue Shield', keywords: ['blue cross', 'bcbs', 'anthem'] },
  { id: 'cigna', name: 'Cigna', keywords: ['cigna'] },
  { id: 'united', name: 'UnitedHealthcare', keywords: ['united', 'optum'] },
  { id: 'aetna', name: 'Aetna', keywords: ['aetna'] },
  { id: 'humana', name: 'Humana', keywords: ['humana'] },
  { id: 'delta', name: 'Delta Dental', keywords: ['delta dental'] },
  { id: 'metlife', name: 'MetLife', keywords: ['metlife'] }
]

function CardScan({ onComplete }) {
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [manualEntry, setManualEntry] = useState(false)
  const [formData, setFormData] = useState({
    provider: '',
    memberId: '',
    firstName: '',
    lastName: ''
  })
  const fileInputRef = useRef(null)

  const handleFileSelect = async (file) => {
    if (!file) return

    setScanning(true)
    setError('')

    try {
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      })

      console.log('OCR Text:', text)
      
      // Extract insurance info from OCR text
      const extractedInfo = extractInsuranceInfo(text)
      
      if (extractedInfo.provider && extractedInfo.memberId) {
        onComplete(extractedInfo)
      } else {
        // If OCR fails, offer manual entry
        setError('Could not read your card clearly. Please enter your information manually.')
        setManualEntry(true)
      }
    } catch (err) {
      console.error('OCR Error:', err)
      setError('Could not scan your card. Please try again or enter manually.')
      setManualEntry(true)
    } finally {
      setScanning(false)
    }
  }

  const extractInsuranceInfo = (text) => {
    const cleanText = text.toLowerCase()
    
    // Find insurance provider
    let provider = null
    for (const prov of INSURANCE_PROVIDERS) {
      for (const keyword of prov.keywords) {
        if (cleanText.includes(keyword)) {
          provider = prov.name
          break
        }
      }
      if (provider) break
    }

    // Extract member ID (look for patterns)
    const memberIdPatterns = [
      /(?:member|id|member id|subscriber)[:\s]*([a-z0-9]{6,15})/i,
      /\b([a-z]{2,3}\d{6,12})\b/i,
      /\b(\d{9,12})\b/
    ]
    
    let memberId = null
    for (const pattern of memberIdPatterns) {
      const match = text.match(pattern)
      if (match) {
        memberId = match[1]
        break
      }
    }

    // Extract name
    const namePattern = /([a-z]+),?\s+([a-z]+)/i
    const nameMatch = text.match(namePattern)
    let firstName = '', lastName = ''
    if (nameMatch) {
      lastName = nameMatch[1]
      firstName = nameMatch[2]
    }

    return {
      provider: provider || 'Unknown',
      memberId: memberId || '',
      firstName,
      lastName
    }
  }

  const handleManualSubmit = (e) => {
    e.preventDefault()
    if (formData.provider && formData.memberId && formData.firstName && formData.lastName) {
      onComplete(formData)
    } else {
      setError('Please fill in all fields')
    }
  }

  const handleInputChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setError('')
  }

  if (manualEntry) {
    return (
      <div className="step slide-up">
        <div className="step-header">
          <h2 className="step-title">Enter Your Insurance Info</h2>
          <p className="step-subtitle">We'll keep this secure and delete it immediately</p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleManualSubmit}>
          <div className="form-group">
            <label className="form-label">Insurance Company</label>
            <select 
              name="provider"
              value={formData.provider}
              onChange={handleInputChange}
              className="form-control"
              required
            >
              <option value="">Select your insurance...</option>
              {INSURANCE_PROVIDERS.map(provider => (
                <option key={provider.id} value={provider.name}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Member ID</label>
            <input 
              type="text"
              name="memberId"
              value={formData.memberId}
              onChange={handleInputChange}
              placeholder="From your insurance card"
              className="form-control"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input 
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input 
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-control"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn">
            Continue →
          </button>
        </form>

        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => setManualEntry(false)}
        >
          📷 Try Camera Again
        </button>
      </div>
    )
  }

  return (
    <div className="step slide-up">
      <div className="step-header">
        <h2 className="step-title">Scan Your Insurance Card</h2>
        <p className="step-subtitle">Take a photo or upload an image</p>
      </div>

      {error && <div className="error">{error}</div>}

      {scanning && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Reading your insurance card...</p>
        </div>
      )}

      {!scanning && (
        <>
          <div 
            className="camera-input"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="camera-icon">📷</div>
            <div className="camera-text">Tap to scan your card</div>
            <div className="camera-subtext">Front side works best</div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileSelect(file)
            }}
          />

          <button 
            className="btn btn-secondary"
            onClick={() => setManualEntry(true)}
          >
            ✍️ Enter Manually Instead
          </button>
        </>
      )}
    </div>
  )
}

export default CardScan