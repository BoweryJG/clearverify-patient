import React from 'react'

function Hero({ onStart }) {
  return (
    <div className="hero">
      <h1>
        Know Your Dental Costs in{' '}
        <span className="highlight">60 Seconds</span>
      </h1>
      
      <p>
        Scan your insurance card, pick your procedure, 
        and see exactly what you'll pay. No calls, no waiting, no surprises.
      </p>
      
      <button className="btn" onClick={onStart}>
        📱 Check My Insurance
      </button>
      
      <button className="btn btn-secondary">
        🎥 See How It Works
      </button>
      
      <div style={{ marginTop: '32px', fontSize: '0.875rem', color: '#6b7280' }}>
        🔒 Completely secure • No data stored • HIPAA compliant
      </div>
    </div>
  )
}

export default Hero