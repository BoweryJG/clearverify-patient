import React, { useState } from 'react'

function ConsentModal({ data, onConsentGiven, onConsentDeclined }) {
  const [patientInfo, setPatientInfo] = useState({
    username: '',
    password: '',
    dateOfBirth: '',
    lastFourSSN: '',
    zipCode: ''
  })
  const [step, setStep] = useState('consent') // consent, credentials

  const handleConsentAccept = () => {
    setStep('credentials')
  }

  const handleCredentialsSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!patientInfo.username || !patientInfo.password || !patientInfo.dateOfBirth) {
      alert('Please fill in all required fields')
      return
    }

    onConsentGiven(patientInfo)
  }

  if (step === 'consent') {
    return (
      <div className="consent-modal">
        <div className="icon">🔒</div>
        <h2>Portal Learning Consent</h2>
        
        <div className="consent-message">
          <p><strong>Good news!</strong> We found your insurance company's portal:</p>
          <p className="portal-name">{data?.learningResult?.insuranceName}</p>
          
          <div className="consent-explanation">
            <h3>What we're asking:</h3>
            <ul>
              <li>Permission to learn how to verify {data?.learningResult?.insuranceName} automatically</li>
              <li>Use your login credentials once to test our automation</li>
              <li>Help future patients get instant verification</li>
            </ul>
            
            <h3>What this means:</h3>
            <ul>
              <li>✅ Your data stays secure and private</li>
              <li>✅ We only access eligibility information</li>
              <li>✅ Future patients with {data?.learningResult?.insuranceName} get 30-second verification</li>
              <li>✅ You're helping improve healthcare for everyone</li>
            </ul>
            
            <div className="privacy-note">
              <small>
                <strong>Privacy:</strong> We use your credentials only for verification. 
                No personal health information is stored. Your login is used once and forgotten.
              </small>
            </div>
          </div>
        </div>

        <div className="consent-buttons">
          <button 
            className="btn-secondary" 
            onClick={onConsentDeclined}
            style={{ marginRight: '10px' }}
          >
            No Thanks - Manual Verification
          </button>
          <button 
            className="btn-primary" 
            onClick={handleConsentAccept}
          >
            Yes - Help Learn This Portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="credentials-form">
      <div className="icon">🔐</div>
      <h2>Portal Login Information</h2>
      
      <p className="form-intro">
        Please provide your <strong>{data?.learningResult?.insuranceName}</strong> portal login information. 
        This will be used once to test and learn the portal.
      </p>

      <form onSubmit={handleCredentialsSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username/Member ID *</label>
          <input
            type="text"
            id="username"
            value={patientInfo.username}
            onChange={(e) => setPatientInfo(prev => ({ ...prev, username: e.target.value }))}
            placeholder="Your member ID or username"
            required
          />
          <small>Usually found on your insurance card</small>
        </div>

        <div className="form-group">
          <label htmlFor="password">Password *</label>
          <input
            type="password"
            id="password"
            value={patientInfo.password}
            onChange={(e) => setPatientInfo(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Your portal password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="dob">Date of Birth *</label>
          <input
            type="date"
            id="dob"
            value={patientInfo.dateOfBirth}
            onChange={(e) => setPatientInfo(prev => ({ ...prev, dateOfBirth: e.target.value }))}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="ssn">Last 4 of SSN</label>
            <input
              type="text"
              id="ssn"
              maxLength="4"
              value={patientInfo.lastFourSSN}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, lastFourSSN: e.target.value }))}
              placeholder="1234"
            />
          </div>

          <div className="form-group">
            <label htmlFor="zip">ZIP Code</label>
            <input
              type="text"
              id="zip"
              maxLength="5"
              value={patientInfo.zipCode}
              onChange={(e) => setPatientInfo(prev => ({ ...prev, zipCode: e.target.value }))}
              placeholder="12345"
            />
          </div>
        </div>

        <div className="security-notice">
          <div className="security-icon">🛡️</div>
          <div>
            <strong>Secure & Private:</strong> Your credentials are encrypted and used only for this verification. 
            We don't store your login information.
          </div>
        </div>

        <div className="form-buttons">
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onConsentDeclined}
            style={{ marginRight: '10px' }}
          >
            Cancel
          </button>
          <button type="submit" className="btn-primary">
            Verify My Insurance
          </button>
        </div>
      </form>

      <style jsx>{`
        .consent-modal, .credentials-form {
          text-align: center;
          padding: 30px;
        }

        .icon {
          font-size: 48px;
          margin-bottom: 20px;
        }

        .portal-name {
          background: #e3f2fd;
          color: #1976d2;
          padding: 10px 20px;
          border-radius: 25px;
          display: inline-block;
          font-weight: bold;
          margin: 10px 0;
        }

        .consent-explanation {
          text-align: left;
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
        }

        .consent-explanation h3 {
          color: #2c3e50;
          margin: 15px 0 10px 0;
          font-size: 16px;
        }

        .consent-explanation ul {
          margin: 10px 0;
          padding-left: 20px;
        }

        .consent-explanation li {
          margin: 8px 0;
          color: #555;
        }

        .privacy-note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 5px;
          padding: 15px;
          margin-top: 15px;
        }

        .consent-buttons {
          margin-top: 30px;
        }

        .form-intro {
          background: #e8f5e8;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          color: #2e7d32;
        }

        .form-group {
          margin-bottom: 20px;
          text-align: left;
        }

        .form-row {
          display: flex;
          gap: 15px;
        }

        .form-row .form-group {
          flex: 1;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .form-group small {
          color: #666;
          font-size: 12px;
          display: block;
          margin-top: 4px;
        }

        .security-notice {
          display: flex;
          align-items: center;
          background: #e8f5e8;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: left;
        }

        .security-icon {
          font-size: 24px;
          margin-right: 12px;
        }

        .form-buttons {
          margin-top: 30px;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          border: none;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        @media (max-width: 600px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .consent-buttons, .form-buttons {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          
          .consent-buttons button, .form-buttons button {
            margin: 0 !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ConsentModal