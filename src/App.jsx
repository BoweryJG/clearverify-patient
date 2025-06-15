import React, { useState, useRef, useEffect } from 'react'
import Hero from './components/Hero'
import CardScan from './components/CardScan'
import ProcedureSelect from './components/ProcedureSelect'
import Loading from './components/Loading'
import Results from './components/Results'
import ConsentModal from './components/ConsentModal'
import VerificationAPIClient from './services/VerificationAPIClient'

function App() {
  const [step, setStep] = useState('hero') // hero, scan, procedure, loading, results, consent
  const [formData, setFormData] = useState({
    insuranceInfo: null,
    procedure: null,
    patientCredentials: null
  })
  const [results, setResults] = useState(null)
  const [consentData, setConsentData] = useState(null)
  const [verificationService] = useState(() => new VerificationAPIClient())
  const [loadingMessage, setLoadingMessage] = useState('Verifying insurance...')

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
    setLoadingMessage('Analyzing insurance portal...')
    
    try {
      // Use intelligent verification system
      const verificationResult = await verificationService.verifyInsurance(
        formData.insuranceInfo,
        formData.patientCredentials,
        procedure.code
      )
      
      if (verificationResult.success) {
        setResults({
          ...verificationResult.data,
          procedure: procedure.name,
          procedureCode: procedure.code,
          averageCost: procedure.cost,
          automated: true,
          executionTime: verificationResult.executionTime
        })
        setStep('results')
      } else if (verificationResult.requiresPatientConsent) {
        setConsentData({
          ...verificationResult,
          procedure
        })
        setStep('consent')
      } else {
        // Handle failure with fallback options
        setResults({
          error: true,
          message: verificationResult.error,
          fallbackOptions: verificationResult.fallbackOptions,
          procedure: procedure.name,
          procedureCode: procedure.code,
          averageCost: procedure.cost
        })
        setStep('results')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setResults({
        error: true,
        message: 'Verification system temporarily unavailable',
        procedure: procedure.name,
        procedureCode: procedure.code,
        averageCost: procedure.cost
      })
      setStep('results')
    }
  }

  const handleConsentGiven = async (patientCredentials) => {
    setFormData(prev => ({ ...prev, patientCredentials }))
    setStep('loading')
    setLoadingMessage('Testing new insurance portal...')
    
    try {
      const testResult = await verificationService.testNewPortalWithConsent(
        consentData.learningResult,
        patientCredentials,
        consentData.verificationId
      )
      
      if (testResult.success) {
        setResults({
          ...testResult.data,
          procedure: consentData.procedure.name,
          procedureCode: consentData.procedure.code,
          averageCost: consentData.procedure.cost,
          automated: true,
          newPortalLearned: true,
          message: testResult.message
        })
      } else {
        setResults({
          error: true,
          message: testResult.error,
          fallbackOptions: testResult.fallbackOptions,
          procedure: consentData.procedure.name,
          procedureCode: consentData.procedure.code,
          averageCost: consentData.procedure.cost
        })
      }
      setStep('results')
    } catch (error) {
      console.error('Consent verification failed:', error)
      setResults({
        error: true,
        message: 'Portal learning failed',
        procedure: consentData.procedure.name,
        procedureCode: consentData.procedure.code,
        averageCost: consentData.procedure.cost
      })
      setStep('results')
    }
  }

  const handleConsentDeclined = () => {
    // Provide manual fallback options
    setResults({
      error: true,
      message: 'Manual verification required',
      fallbackOptions: [
        {
          method: 'manual_portal',
          title: 'Manual Portal Lookup',
          description: 'Staff can log into the insurance portal manually',
          estimatedTime: '3-5 minutes'
        },
        {
          method: 'phone_verification',
          title: 'Phone Verification',
          description: 'Call the insurance company directly',
          estimatedTime: '10-15 minutes'
        }
      ],
      procedure: consentData.procedure.name,
      procedureCode: consentData.procedure.code,
      averageCost: consentData.procedure.cost
    })
    setStep('results')
  }

  const handleStartOver = () => {
    setStep('hero')
    setFormData({ insuranceInfo: null, procedure: null, patientCredentials: null })
    setResults(null)
    setConsentData(null)
    setLoadingMessage('Verifying insurance...')
  }

  const handleBack = () => {
    switch(step) {
      case 'scan':
        setStep('hero')
        break
      case 'procedure':
        setStep('scan')
        break
      case 'consent':
        setStep('procedure')
        break
      case 'results':
        setStep('procedure')
        break
      default:
        setStep('hero')
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      verificationService.shutdown()
    }
  }, [])

  return (
    <div className="container">
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 0' }}>
        <div className="card fade-in" style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
          {step !== 'hero' && step !== 'consent' && (
            <button className="back-btn" onClick={handleBack}>
              ← Back
            </button>
          )}
          
          {step === 'hero' && <Hero onStart={handleStart} />}
          {step === 'scan' && <CardScan onComplete={handleCardScan} />}
          {step === 'procedure' && <ProcedureSelect onSelect={handleProcedureSelect} />}
          {step === 'loading' && <Loading message={loadingMessage} />}
          {step === 'consent' && (
            <ConsentModal 
              data={consentData}
              onConsentGiven={handleConsentGiven}
              onConsentDeclined={handleConsentDeclined}
            />
          )}
          {step === 'results' && <Results data={results} onStartOver={handleStartOver} />}
        </div>
      </div>
    </div>
  )
}

export default App