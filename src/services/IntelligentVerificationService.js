import PortalLearner from './PortalLearner.js';
import PortalAutomator from './PortalAutomator.js';

class IntelligentVerificationService {
  constructor() {
    this.portalLearner = new PortalLearner();
    this.portalAutomator = new PortalAutomator();
    this.verificationHistory = new Map();
    this.learningQueue = [];
  }

  async verifyInsurance(insuranceInfo, patientCredentials, procedureCode = null) {
    console.log(`🎯 Starting intelligent verification for ${insuranceInfo.insuranceName}`);
    
    const verificationId = this.generateVerificationId();
    const startTime = Date.now();
    
    try {
      // Step 1: Check if we know this insurer
      const portalStatus = this.portalLearner.getPortalStatus(insuranceInfo.insuranceName);
      
      if (portalStatus.status === 'unknown') {
        console.log(`🆕 Unknown insurer detected: ${insuranceInfo.insuranceName}`);
        return await this.handleNewInsurer(insuranceInfo, patientCredentials, verificationId);
      }
      
      // Step 2: We know this insurer - proceed with automation
      console.log(`✅ Known insurer: ${insuranceInfo.insuranceName} (confidence: ${portalStatus.confidence})`);
      return await this.executeKnownPortalVerification(insuranceInfo, patientCredentials, verificationId);
      
    } catch (error) {
      console.error(`❌ Verification failed for ${insuranceInfo.insuranceName}:`, error);
      
      // Record the failure for learning
      await this.recordVerificationFailure(verificationId, insuranceInfo, error);
      
      return {
        success: false,
        verificationId,
        error: error.message,
        fallbackOptions: await this.generateFallbackOptions(insuranceInfo),
        executionTime: Date.now() - startTime
      };
    }
  }

  async handleNewInsurer(insuranceInfo, patientCredentials, verificationId) {
    console.log(`🤖 Learning new insurer: ${insuranceInfo.insuranceName}`);
    
    // Step 1: Analyze the portal structure
    const learningResult = await this.portalLearner.encounterNewInsurer(
      insuranceInfo.insuranceName,
      { ...insuranceInfo, ...patientCredentials }
    );
    
    if (!learningResult) {
      return {
        success: false,
        verificationId,
        error: 'Could not analyze portal structure',
        requiresManualSetup: true
      };
    }
    
    // Step 2: Request patient consent for testing
    if (learningResult.requiresPatientConsent) {
      return {
        success: false,
        verificationId,
        requiresPatientConsent: true,
        consentMessage: `We found ${insuranceInfo.insuranceName}'s portal, but need your permission to test our automation. This will help us support future patients instantly.`,
        learningResult,
        nextStep: 'testNewPortal'
      };
    }
    
    // Step 3: If we have consent, test immediately
    return await this.testNewPortalWithConsent(learningResult, patientCredentials, verificationId);
  }

  async testNewPortalWithConsent(learningResult, patientCredentials, verificationId, consentToken) {
    console.log(`🧪 Testing new portal with patient consent: ${learningResult.insuranceName}`);
    
    try {
      // Generate consent token if not provided
      if (!consentToken) {
        consentToken = this.generateConsentToken(patientCredentials);
      }
      
      // Test the portal automation
      const testResult = await this.portalLearner.testPortalAutomation(
        learningResult.analysis,
        patientCredentials
      );
      
      if (testResult.success) {
        console.log(`🎉 Successfully learned ${learningResult.insuranceName}!`);
        
        // Now execute the real verification
        const verificationResult = await this.portalAutomator.executePortalAutomation(
          testResult.config,
          patientCredentials,
          consentToken
        );
        
        return {
          success: true,
          verificationId,
          data: verificationResult.data,
          newPortalLearned: true,
          message: `Great! We learned how to verify ${learningResult.insuranceName} and got your results. Future patients with this insurance will get instant verification!`,
          executionTime: verificationResult.executionTime
        };
      } else {
        console.log(`❌ Failed to learn ${learningResult.insuranceName}`);
        
        return {
          success: false,
          verificationId,
          error: testResult.error,
          learningFailed: true,
          fallbackOptions: await this.generateFallbackOptions({
            insuranceName: learningResult.insuranceName
          })
        };
      }
      
    } catch (error) {
      console.error(`💥 Portal testing crashed:`, error);
      
      return {
        success: false,
        verificationId,
        error: error.message,
        requiresManualIntervention: true
      };
    }
  }

  async executeKnownPortalVerification(insuranceInfo, patientCredentials, verificationId) {
    const portalConfig = this.portalLearner.knownPortals.get(insuranceInfo.insuranceName.toLowerCase());
    const consentToken = this.generateConsentToken(patientCredentials);
    
    try {
      const result = await this.portalAutomator.executePortalAutomation(
        portalConfig,
        patientCredentials,
        consentToken
      );
      
      if (result.success) {
        // Record successful verification
        await this.recordSuccessfulVerification(verificationId, insuranceInfo, result);
        
        // Provide feedback to improve the system
        await this.portalLearner.improveFromFeedback(
          insuranceInfo.insuranceName,
          true,
          { executionTime: result.executionTime }
        );
        
        return {
          success: true,
          verificationId,
          data: this.formatVerificationData(result.data),
          executionTime: result.executionTime,
          confidence: portalConfig.confidence || 0.8
        };
      } else {
        // Handle automation failure
        await this.handleAutomationFailure(verificationId, insuranceInfo, result, portalConfig);
        
        return {
          success: false,
          verificationId,
          error: result.error,
          fallbackOptions: await this.generateFallbackOptions(insuranceInfo),
          retryAvailable: true
        };
      }
      
    } catch (error) {
      console.error(`💥 Known portal verification crashed:`, error);
      
      return {
        success: false,
        verificationId,
        error: error.message,
        systemError: true
      };
    }
  }

  formatVerificationData(rawData) {
    // Format the extracted data into a standardized structure
    return {
      eligibilityStatus: this.parseEligibilityStatus(rawData.eligibilityInfo),
      benefits: {
        deductible: this.parseDeductible(rawData.eligibilityInfo?.deductible),
        maxBenefit: this.parseMaxBenefit(rawData.eligibilityInfo?.maxBenefit),
        copayment: this.parseCopayment(rawData.eligibilityInfo?.copay),
        coinsurance: this.parseCoinsurance(rawData.eligibilityInfo?.copay)
      },
      coverage: {
        effectiveDate: this.parseDate(rawData.eligibilityInfo?.effectiveDate),
        planType: this.parsePlanType(rawData.eligibilityInfo),
        networkStatus: 'in-network' // Default assumption
      },
      verification: {
        verifiedAt: new Date().toISOString(),
        source: 'automated_portal',
        confidence: 0.9
      }
    };
  }

  parseEligibilityStatus(data) {
    if (!data) return 'unknown';
    
    const status = data.eligibilityStatus?.toLowerCase() || '';
    
    if (status.includes('active') || status.includes('eligible')) {
      return 'active';
    } else if (status.includes('inactive') || status.includes('terminated')) {
      return 'inactive';
    } else {
      return 'unknown';
    }
  }

  parseDeductible(deductibleText) {
    if (!deductibleText) return null;
    
    // Extract dollar amounts from text like "$500 remaining" or "$1000 annual"
    const match = deductibleText.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(',', '')) : null;
  }

  parseMaxBenefit(benefitText) {
    if (!benefitText) return null;
    
    const match = benefitText.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(',', '')) : null;
  }

  parseCopayment(copayText) {
    if (!copayText) return null;
    
    // Handle both dollar amounts and percentages
    const dollarMatch = copayText.match(/\$?([\d]+)/);
    const percentMatch = copayText.match(/([\d]+)%/);
    
    if (dollarMatch) {
      return { type: 'fixed', amount: parseInt(dollarMatch[1]) };
    } else if (percentMatch) {
      return { type: 'percentage', amount: parseInt(percentMatch[1]) };
    }
    
    return null;
  }

  parseCoinsurance(copayText) {
    // Similar to copayment but specifically for coinsurance
    return this.parseCopayment(copayText);
  }

  parseDate(dateText) {
    if (!dateText) return null;
    
    try {
      return new Date(dateText).toISOString();
    } catch {
      return null;
    }
  }

  parsePlanType(data) {
    const text = JSON.stringify(data).toLowerCase();
    
    if (text.includes('hmo')) return 'HMO';
    if (text.includes('ppo')) return 'PPO';
    if (text.includes('epo')) return 'EPO';
    if (text.includes('pos')) return 'POS';
    
    return 'unknown';
  }

  async generateFallbackOptions(insuranceInfo) {
    return [
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
        estimatedTime: '10-15 minutes',
        phoneNumber: await this.lookupInsurancePhone(insuranceInfo.insuranceName)
      },
      {
        method: 'schedule_later',
        title: 'Verify Later',
        description: 'Proceed with treatment and verify benefits afterward',
        risk: 'Patient may be responsible for costs if not covered'
      }
    ];
  }

  async lookupInsurancePhone(insuranceName) {
    // In reality, this would query a database of insurance phone numbers
    const commonNumbers = {
      'delta dental': '800-765-6003',
      'blue cross': '800-810-2583',
      'aetna': '800-872-3862',
      'cigna': '800-244-6224',
      'unitedhealth': '800-252-5200'
    };
    
    const key = insuranceName.toLowerCase();
    for (const [name, number] of Object.entries(commonNumbers)) {
      if (key.includes(name)) {
        return number;
      }
    }
    
    return '800-xxx-xxxx (lookup required)';
  }

  generateConsentToken(patientCredentials) {
    const consent = {
      patientId: patientCredentials.memberId || 'anonymous',
      timestamp: Date.now(),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      purpose: 'insurance_verification',
      scope: ['eligibility', 'benefits']
    };
    
    return Buffer.from(JSON.stringify(consent)).toString('base64');
  }

  generateVerificationId() {
    return `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async recordSuccessfulVerification(verificationId, insuranceInfo, result) {
    this.verificationHistory.set(verificationId, {
      success: true,
      insuranceName: insuranceInfo.insuranceName,
      timestamp: Date.now(),
      executionTime: result.executionTime,
      dataQuality: this.assessDataQuality(result.data)
    });
  }

  async recordVerificationFailure(verificationId, insuranceInfo, error) {
    this.verificationHistory.set(verificationId, {
      success: false,
      insuranceName: insuranceInfo.insuranceName,
      timestamp: Date.now(),
      error: error.message,
      errorType: this.categorizeError(error)
    });
  }

  assessDataQuality(data) {
    let score = 0;
    let maxScore = 5;
    
    if (data.eligibilityStatus) score++;
    if (data.deductible !== null) score++;
    if (data.maxBenefit !== null) score++;
    if (data.copay !== null) score++;
    if (data.effectiveDate) score++;
    
    return score / maxScore;
  }

  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('captcha')) return 'captcha';
    if (message.includes('timeout')) return 'timeout';
    if (message.includes('consent')) return 'consent';
    if (message.includes('credential')) return 'authentication';
    if (message.includes('selector')) return 'portal_change';
    
    return 'unknown';
  }

  async handleAutomationFailure(verificationId, insuranceInfo, result, portalConfig) {
    console.log(`🔧 Handling automation failure for ${insuranceInfo.insuranceName}`);
    
    // Provide feedback to the learning system
    await this.portalLearner.improveFromFeedback(
      insuranceInfo.insuranceName,
      false,
      {
        error: result.error,
        sessionId: result.sessionId,
        timestamp: Date.now()
      }
    );
    
    // Record for analysis
    await this.recordVerificationFailure(verificationId, insuranceInfo, new Error(result.error));
  }

  // Public API methods
  async getSupportedInsurers() {
    const supported = [];
    
    for (const [name, config] of this.portalLearner.knownPortals) {
      supported.push({
        name: name,
        confidence: config.confidence,
        successRate: this.portalLearner.calculateSuccessRate(config),
        lastUsed: config.lastUsed,
        supportLevel: config.confidence > 0.8 ? 'high' : 'medium'
      });
    }
    
    return supported.sort((a, b) => b.successRate - a.successRate);
  }

  async getVerificationStats() {
    const stats = {
      totalVerifications: this.verificationHistory.size,
      successfulVerifications: 0,
      averageExecutionTime: 0,
      supportedInsurers: this.portalLearner.knownPortals.size,
      learningQueueSize: this.learningQueue.length
    };
    
    let totalTime = 0;
    
    for (const verification of this.verificationHistory.values()) {
      if (verification.success) {
        stats.successfulVerifications++;
        totalTime += verification.executionTime || 0;
      }
    }
    
    stats.successRate = stats.totalVerifications > 0 
      ? stats.successfulVerifications / stats.totalVerifications 
      : 0;
    
    stats.averageExecutionTime = stats.successfulVerifications > 0
      ? totalTime / stats.successfulVerifications
      : 0;
    
    return stats;
  }

  async shutdown() {
    await this.portalAutomator.shutdown();
  }
}

export default IntelligentVerificationService;