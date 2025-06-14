import React from 'react'

function Results({ data, onStartOver }) {
  return (
    <div className="results slide-up">
      <div className="results-header">
        <div className="results-icon">✅</div>
        <h2 className="results-title">You're Covered!</h2>
        <p className="results-subtitle">Here's exactly what you'll pay</p>
      </div>

      <div className="cost-breakdown">
        <div className="cost-item">
          <span className="cost-label">Procedure</span>
          <span className="cost-value">{data.procedure}</span>
        </div>
        
        <div className="cost-item">
          <span className="cost-label">Total Cost</span>
          <span className="cost-value">${data.averageCost}</span>
        </div>
        
        <div className="cost-item">
          <span className="cost-label">Insurance Pays ({data.coverage}%)</span>
          <span className="cost-value">${data.insurancePays}</span>
        </div>
        
        <div className="cost-item">
          <span className="cost-label">You Pay</span>
          <span className="cost-value">${data.patientCost}</span>
        </div>
      </div>

      <div style={{ background: '#eff6ff', borderRadius: '12px', padding: '16px', margin: '20px 0', fontSize: '0.875rem', color: '#1e40af' }}>
        💡 <strong>Good news!</strong> You have ${data.deductibleRemaining} left on your deductible this year.
      </div>

      <button className="btn" style={{ marginBottom: '12px' }}>
        📅 Book My Appointment
      </button>

      <button className="btn btn-secondary" onClick={onStartOver}>
        🔄 Check Another Procedure
      </button>

      <div style={{ marginTop: '24px', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
        * Estimates based on your benefits and local averages. 
        Final costs may vary by dentist and actual procedures needed.
      </div>
    </div>
  )
}

export default Results