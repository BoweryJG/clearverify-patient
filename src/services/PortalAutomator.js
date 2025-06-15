import puppeteer from 'puppeteer';

class PortalAutomator {
  constructor() {
    this.browser = null;
    this.activeSessions = new Map();
    this.maxConcurrentSessions = 5;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: false, // Set to true in production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
    }
  }

  async executePortalAutomation(portalConfig, patientCredentials, consentToken) {
    console.log(`🤖 Starting portal automation for ${portalConfig.insuranceName}`);
    
    // Verify patient consent
    if (!this.verifyPatientConsent(consentToken)) {
      throw new Error('Patient consent required for portal access');
    }

    const sessionId = this.generateSessionId();
    
    try {
      await this.initialize();
      const page = await this.createSecurePage();
      
      this.activeSessions.set(sessionId, {
        page,
        startTime: Date.now(),
        portalConfig,
        status: 'active'
      });

      // Execute the automation script
      const result = await this.runAutomationScript(
        page, 
        portalConfig.config.automationScript, 
        patientCredentials
      );

      await this.cleanupSession(sessionId);
      
      return {
        success: true,
        data: result,
        sessionId,
        executionTime: Date.now() - this.activeSessions.get(sessionId).startTime
      };

    } catch (error) {
      console.error(`❌ Portal automation failed:`, error);
      await this.cleanupSession(sessionId);
      
      return {
        success: false,
        error: error.message,
        sessionId
      };
    }
  }

  async createSecurePage() {
    const page = await this.browser.newPage();
    
    // Set security headers and user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.setViewport({ width: 1280, height: 720 });
    
    // Block unnecessary resources to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Handle console messages for debugging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Portal console error:', msg.text());
      }
    });

    return page;
  }

  async runAutomationScript(page, script, credentials) {
    console.log(`📋 Executing ${script.steps.length} automation steps`);
    
    const results = {};
    let currentStep = 0;

    for (const step of script.steps) {
      try {
        console.log(`Step ${currentStep + 1}: ${step.action} - ${step.target}`);
        
        const stepResult = await this.executeStep(page, step, credentials, results);
        results[step.target] = stepResult;
        
        currentStep++;
        
        // Add delay between steps to avoid detection
        await this.randomDelay(500, 2000);
        
      } catch (error) {
        console.error(`❌ Step ${currentStep + 1} failed:`, error);
        
        // Try fallback steps if available
        if (script.fallbackSteps && script.fallbackSteps[currentStep]) {
          console.log(`🔄 Trying fallback for step ${currentStep + 1}`);
          try {
            const fallbackResult = await this.executeStep(
              page, 
              script.fallbackSteps[currentStep], 
              credentials, 
              results
            );
            results[step.target] = fallbackResult;
            currentStep++;
            continue;
          } catch (fallbackError) {
            console.error(`❌ Fallback also failed:`, fallbackError);
          }
        }
        
        throw new Error(`Automation failed at step ${currentStep + 1}: ${error.message}`);
      }
    }

    return results;
  }

  async executeStep(page, step, credentials, previousResults) {
    switch (step.action) {
      case 'navigate':
        return await this.handleNavigation(page, step, credentials);
        
      case 'fillField':
        return await this.handleFieldFill(page, step, credentials);
        
      case 'click':
        return await this.handleClick(page, step);
        
      case 'waitForElement':
        return await this.handleWaitForElement(page, step);
        
      case 'extractData':
        return await this.handleDataExtraction(page, step);
        
      case 'handleCaptcha':
        return await this.handleCaptcha(page, step);
        
      case 'handleTwoFactor':
        return await this.handleTwoFactor(page, step, credentials);
        
      default:
        throw new Error(`Unknown step action: ${step.action}`);
    }
  }

  async handleNavigation(page, step, credentials) {
    let url;
    
    if (step.target === 'loginPage') {
      url = credentials.portalUrl || this.inferLoginUrl(credentials.insuranceName);
    } else if (step.target === 'eligibilityPage') {
      url = await this.findEligibilityUrl(page);
    } else {
      url = step.url;
    }

    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2000);
    
    return { url, timestamp: Date.now() };
  }

  async handleFieldFill(page, step, credentials) {
    const selector = step.selector;
    const value = this.getCredentialValue(step.target, credentials);
    
    if (!value) {
      throw new Error(`No credential value found for ${step.target}`);
    }

    console.log(`✏️ Filling ${step.target} field`);
    
    // Wait for element to be present and visible
    await page.waitForSelector(selector, { visible: true, timeout: 10000 });
    
    // Clear existing value
    await page.click(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    
    // Type the value with human-like timing
    await this.typeHumanLike(page, selector, value);
    
    return { field: step.target, filled: true };
  }

  async handleClick(page, step) {
    const selector = step.selector;
    
    console.log(`👆 Clicking ${step.target}`);
    
    // Wait for element to be clickable
    await page.waitForSelector(selector, { visible: true, timeout: 10000 });
    
    // Scroll element into view
    await page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, selector);
    
    await page.click(selector);
    
    // Wait for navigation if expected
    if (step.waitForNavigation) {
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 });
    }
    
    return { clicked: true, target: step.target };
  }

  async handleDataExtraction(page, step) {
    console.log(`📊 Extracting data for ${step.target}`);
    
    const extractedData = {};
    
    // Wait for data to load
    await page.waitForTimeout(3000);
    
    for (const [dataType, selectors] of Object.entries(step.selectors)) {
      try {
        const value = await this.extractDataFromSelectors(page, selectors);
        extractedData[dataType] = value;
      } catch (error) {
        console.log(`⚠️ Could not extract ${dataType}:`, error.message);
        extractedData[dataType] = null;
      }
    }
    
    return extractedData;
  }

  async extractDataFromSelectors(page, selectors) {
    for (const selector of selectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 5000 });
        if (element) {
          const text = await page.evaluate(el => el.textContent?.trim(), element);
          if (text && text.length > 0) {
            return this.cleanExtractedText(text);
          }
        }
      } catch (error) {
        // Try next selector
        continue;
      }
    }
    
    throw new Error('No data found with provided selectors');
  }

  cleanExtractedText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s$.,%-]/g, '')
      .trim();
  }

  async typeHumanLike(page, selector, text) {
    await page.focus(selector);
    
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomDelay(50, 150);
    }
  }

  async randomDelay(min, max) {
    const delay = Math.random() * (max - min) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  getCredentialValue(fieldType, credentials) {
    const mapping = {
      'username': credentials.username || credentials.memberId,
      'password': credentials.password,
      'memberId': credentials.memberId,
      'dob': credentials.dateOfBirth,
      'ssn': credentials.lastFourSSN,
      'zipCode': credentials.zipCode
    };
    
    return mapping[fieldType];
  }

  inferLoginUrl(insuranceName) {
    // Generate likely login URLs based on insurer name
    const cleanName = insuranceName.toLowerCase().replace(/\s+/g, '');
    return `https://www.${cleanName}.com/member/login`;
  }

  async findEligibilityUrl(page) {
    // Look for eligibility/benefits links on the current page
    const eligibilitySelectors = [
      'a[href*="eligibility"]',
      'a[href*="benefits"]', 
      'a[href*="coverage"]',
      'a:contains("Benefits")',
      'a:contains("Eligibility")',
      'a:contains("Coverage")'
    ];
    
    for (const selector of eligibilitySelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const href = await page.evaluate(el => el.href, element);
          return href;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Fallback: try common paths
    const currentUrl = page.url();
    return `${currentUrl}/benefits`;
  }

  verifyPatientConsent(consentToken) {
    // Verify the consent token is valid and not expired
    try {
      const consent = JSON.parse(Buffer.from(consentToken, 'base64').toString());
      const now = Date.now();
      
      return (
        consent.patientId &&
        consent.timestamp &&
        consent.expiresAt > now &&
        consent.purpose === 'insurance_verification'
      );
    } catch (error) {
      return false;
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async cleanupSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session && session.page) {
      try {
        await session.page.close();
      } catch (error) {
        console.error('Error closing page:', error);
      }
    }
    this.activeSessions.delete(sessionId);
  }

  async handleCaptcha(page, step) {
    console.log('🔒 CAPTCHA detected - requires human intervention');
    
    // In a real implementation, you might:
    // 1. Use a CAPTCHA solving service
    // 2. Pause automation and ask for human help
    // 3. Switch to a different approach
    
    throw new Error('CAPTCHA encountered - human intervention required');
  }

  async handleTwoFactor(page, step, credentials) {
    console.log('📱 Two-factor authentication required');
    
    // This would need integration with SMS/email services
    // For now, throw an error requiring manual intervention
    
    throw new Error('Two-factor authentication required - manual intervention needed');
  }

  async shutdown() {
    // Close all active sessions
    for (const [sessionId, session] of this.activeSessions) {
      await this.cleanupSession(sessionId);
    }
    
    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  getSessionStatus(sessionId) {
    return this.activeSessions.get(sessionId)?.status || 'not_found';
  }
}

export default PortalAutomator;