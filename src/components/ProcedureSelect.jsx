import React, { useState } from 'react'

const PROCEDURES = [
  {
    code: 'D0120',
    name: 'Cleaning',
    description: 'Regular cleaning',
    icon: '🦷',
    category: 'Preventive',
    cost: 95,
    coverage: 100
  },
  {
    code: 'D0210',
    name: 'X-rays',
    description: 'Complete set',
    icon: '📸',
    category: 'Preventive',
    cost: 150,
    coverage: 100
  },
  {
    code: 'D2391',
    name: 'Filling',
    description: 'Tooth colored',
    icon: '🔧',
    category: 'Basic',
    cost: 225,
    coverage: 80
  },
  {
    code: 'D2740',
    name: 'Crown',
    description: 'Full coverage',
    icon: '👑',
    category: 'Major',
    cost: 1200,
    coverage: 50
  },
  {
    code: 'D6010',
    name: 'Implant',
    description: 'Single tooth',
    icon: '🔩',
    category: 'Major',
    cost: 3500,
    coverage: 50
  },
  {
    code: 'D7210',
    name: 'Extraction',
    description: 'Simple removal',
    icon: '🚫',
    category: 'Basic',
    cost: 180,
    coverage: 80
  }
]

function ProcedureSelect({ onSelect }) {
  const [selected, setSelected] = useState(null)

  const handleSelect = (procedure) => {
    setSelected(procedure.code)
    // Auto-advance after selection
    setTimeout(() => {
      onSelect(procedure)
    }, 500)
  }

  return (
    <div className="step slide-up">
      <div className="step-header">
        <h2 className="step-title">What do you need done?</h2>
        <p className="step-subtitle">Pick the closest match</p>
      </div>

      <div className="procedure-grid">
        {PROCEDURES.map(procedure => (
          <div
            key={procedure.code}
            className={`procedure-card ${selected === procedure.code ? 'selected' : ''}`}
            onClick={() => handleSelect(procedure)}
          >
            <span className="procedure-icon">{procedure.icon}</span>
            <div className="procedure-name">{procedure.name}</div>
            <div style={{ fontSize: '0.75rem', color: selected === procedure.code ? 'rgba(255,255,255,0.8)' : '#64748b', marginTop: '4px' }}>
              {procedure.description}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: '600', marginTop: '8px', color: selected === procedure.code ? '#fef3c7' : '#059669' }}>
              ~${procedure.cost}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        Don't see your procedure? We'll show estimates for similar treatments.
      </div>
    </div>
  )
}

export default ProcedureSelect