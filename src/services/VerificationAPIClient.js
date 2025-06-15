class VerificationAPIClient {
  constructor() {
    // In production, this would be your backend API URL
    // For local development, you'll need to run the clearverify-api server
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';
    this.verificationHistory = new Map();
  }

  async verifyInsurance(insuranceInfo, patientCredentials, procedureCode = null) {
    console.log(`🎯 Starting insurance verification for ${insuranceInfo.insuranceName}`);
    
    try {
      const response = await fetch(`${this.apiUrl}/verification/instant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          insuranceInfo,
          patientCredentials,
          procedureCode
        })
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Verification error:', error);
      
      // Return a fallback response if the backend is not available
      if (error.message.includes('fetch')) {
        console.warn('Backend not available, returning mock data for development');
        return this.getMockResponse(insuranceInfo);
      }
      
      throw error;
    }
  }

  async getSupportedInsurers() {
    try {
      const response = await fetch(`${this.apiUrl}/supported-insurers`);
      
      if (!response.ok) {
        throw new Error(`Failed to get supported insurers: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching supported insurers:', error);
      
      // Return mock data for development
      return this.getMockSupportedInsurers();
    }
  }

  async getVerificationStats() {
    try {
      const response = await fetch(`${this.apiUrl}/verification-stats`);
      
      if (!response.ok) {
        throw new Error(`Failed to get verification stats: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching verification stats:', error);
      
      // Return mock data for development
      return this.getMockStats();
    }
  }

  async testNewPortalWithConsent(learningResult, patientCredentials, verificationId, consentToken) {
    try {
      const response = await fetch(`${this.apiUrl}/test-new-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          learningResult,
          patientCredentials,
          verificationId,
          consentToken
        })
      });

      if (!response.ok) {
        throw new Error(`Portal test failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Portal test error:', error);
      throw error;
    }
  }

  // Mock responses for development when backend is not available
  getMockResponse(insuranceInfo) {
    const verificationId = this.generateVerificationId();
    
    return {
      success: true,
      verificationId,
      data: {
        eligibilityStatus: 'active',
        benefits: {
          deductible: 1500,
          maxBenefit: 5000,
          copayment: { type: 'percentage', amount: 20 },
          coinsurance: { type: 'percentage', amount: 20 }
        },
        coverage: {
          effectiveDate: new Date().toISOString(),
          planType: 'PPO',
          networkStatus: 'in-network'
        },
        verification: {
          verifiedAt: new Date().toISOString(),
          source: 'mock_verification',
          confidence: 0.9
        }
      },
      executionTime: 2000,
      confidence: 0.9,
      message: 'Note: This is mock data. Please ensure the backend server is running for real verification.'
    };
  }

  getMockSupportedInsurers() {
    return [
      {
        name: 'delta dental',
        confidence: 0.95,
        successRate: 0.98,
        lastUsed: new Date().toISOString(),
        supportLevel: 'high'
      },
      {
        name: 'blue cross',
        confidence: 0.92,
        successRate: 0.96,
        lastUsed: new Date().toISOString(),
        supportLevel: 'high'
      },
      {
        name: 'aetna',
        confidence: 0.88,
        successRate: 0.94,
        lastUsed: new Date().toISOString(),
        supportLevel: 'high'
      }
    ];
  }

  getMockStats() {
    return {
      totalVerifications: 150,
      successfulVerifications: 145,
      averageExecutionTime: 1850,
      supportedInsurers: 25,
      learningQueueSize: 3,
      successRate: 0.97
    };
  }

  generateVerificationId() {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown() {
    // Clean up any connections if needed
    console.log('API client shutdown');
  }
}

export default VerificationAPIClient;