import React, { useState } from 'react'
import Hero from './components/Hero'
import CardScan from './components/CardScan'
import ProcedureSelect from './components/ProcedureSelect'
import Loading from './components/Loading'
import Results from './components/Results'

function App() {
  const [step, setStep] = useState('hero') // hero, scan, procedure, loading, results
  const [formData, setFormData] = useState({
    insuranceInfo: null,
    procedure: null
  })
  const [results, setResults] = useState(null)

  const handleStart = () => {
    setStep('scan')
  }

  const handleCardScan = (insuranceInfo) => {
    setFormData(prev => ({ ...prev, insuranceInfo }))
    setStep('procedure')
  }

  const handleProcedureSelect = async (procedure) => {
    setFormData(prev => ({ ...prev, procedure }))
    setStep('loading')
    
    // Simulate API call
    setTimeout(() => {
      const mockResults = {
        procedure: procedure.name,
        procedureCode: procedure.code,
        averageCost: procedure.cost,
        coverage: procedure.coverage,
        patientCost: Math.round(procedure.cost * (1 - procedure.coverage / 100)),
        deductibleRemaining: 1200,
        insurancePays: Math.round(procedure.cost * (procedure.coverage / 100))
      }
      setResults(mockResults)
      setStep('results')
    }, 3000)
  }

  const handleStartOver = () => {
    setStep('hero')
    setFormData({ insuranceInfo: null, procedure: null })
    setResults(null)
  }

  const handleBack = () => {
    switch(step) {
      case 'scan':
        setStep('hero')
        break
      case 'procedure':
        setStep('scan')
        break
      case 'results':
        setStep('procedure')
        break
      default:
        setStep('hero')
    }
  }

  return (
    <div className="container">
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <div className="card fade-in" style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
          {step !== 'hero' && (
            <button className="back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          
          {step === 'hero' && <Hero onStart={handleStart} />}
          {step === 'scan' && <CardScan onComplete={handleCardScan} />}
          {step === 'procedure' && <ProcedureSelect onSelect={handleProcedureSelect} />}
          {step === 'loading' && <Loading />}
          {step === 'results' && <Results data={results} onStartOver={handleStartOver} />}
        </div>
      </div>
    </div>
  )
}

export default App