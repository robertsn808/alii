const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');

class AIErrorAnalyzer {
  constructor(config) {
    this.config = config;
    
    // Initialize AI clients
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.analysisCache = new Map();
    this.codebaseContext = new Map();
    this.loadCodebaseContext();
  }

  async loadCodebaseContext() {
    try {
      // Load key project files for context
      const contextFiles = [
        '../../backend/src/main/java/com/aliifishmarket/AliiFishMarketApplication.java',
        '../../backend/src/main/resources/application.yml',
        '../../frontend/src/app/layout.tsx',
        '../../frontend/package.json',
        '../../backend/pom.xml',
        '../../CLAUDE.md'
      ];

      for (const filePath of contextFiles) {
        try {
          const content = await fs.readFile(path.join(__dirname, filePath), 'utf8');
          this.codebaseContext.set(filePath, content);
        } catch (err) {
          console.warn(`Could not load context file: ${filePath}`);
        }
      }
    } catch (err) {
      console.error('Error loading codebase context:', err);
    }
  }

  async analyzeError(error) {
    const cacheKey = this.generateCacheKey(error);
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      // Primary analysis with Claude
      const claudeAnalysis = await this.analyzeWithClaude(error);
      
      // Secondary analysis with OpenAI for validation
      const openaiAnalysis = await this.analyzeWithOpenAI(error);
      
      // Combine and synthesize analyses
      const finalAnalysis = this.synthesizeAnalyses(claudeAnalysis, openaiAnalysis, error);
      
      // Cache the result
      this.analysisCache.set(cacheKey, finalAnalysis);
      
      return finalAnalysis;
    } catch (err) {
      console.error('Error analyzing with AI:', err);
      return this.fallbackAnalysis(error);
    }
  }

  async analyzeWithClaude(error) {
    const systemPrompt = `You are an expert software engineer analyzing errors in the Alii Fish Market application - a Toast POS replacement system using Universal Payment Protocol (UPP).

Key system components:
- Frontend: Next.js/React with TypeScript
- Backend: Spring Boot with Java
- Database: PostgreSQL
- Payment Processing: UPP integration + Stripe fallback
- Deployment: Render.com with custom domains

Your task is to analyze errors and provide:
1. Root cause analysis
2. Impact assessment
3. Recommended fixes
4. Prevention strategies
5. Code examples when applicable

Be specific to the Alii Fish Market context and UPP payment system.`;

    const userPrompt = this.buildClaudePrompt(error);

    const response = await this.claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.1,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: userPrompt
      }]
    });

    return this.parseClaudeResponse(response.content[0].text);
  }

  buildClaudePrompt(error) {
    const contextInfo = this.getRelevantContext(error);
    
    return `
## Error Details
**Type:** ${error.type}
**Severity:** ${error.severity}
**Message:** ${error.message}
**Service:** ${error.context.service}
**Environment:** ${error.context.environment}
**File Path:** ${error.filePath}
**Raw Log:** ${error.rawLine}

${error.stackTrace ? `**Stack Trace:**\n${error.stackTrace}` : ''}

## System Context
${contextInfo}

## Analysis Request
Please analyze this error in the context of the Alii Fish Market UPP system and provide:

1. **Root Cause**: What exactly caused this error?
2. **Impact**: How does this affect the business operations?
3. **Urgency**: How quickly does this need to be fixed?
4. **Fix Recommendations**: Specific code changes or configuration updates
5. **Prevention**: How to prevent similar errors in the future
6. **Related Code**: Any files that might need to be examined or modified

Focus on:
- Payment processing reliability (UPP/Stripe integration)
- Customer order flow integrity
- Staff app functionality
- Business dashboard accuracy
- Performance impact on Toast POS replacement

Provide actionable, specific recommendations with code examples where applicable.
`;
  }

  async analyzeWithOpenAI(error) {
    const systemPrompt = `You are a senior software engineer specializing in error analysis and resolution. You're working on the Alii Fish Market project - a comprehensive Toast POS replacement system.

System Architecture:
- Frontend: Next.js with TypeScript
- Backend: Spring Boot (Java)
- Database: PostgreSQL  
- Payments: Universal Payment Protocol (UPP) + Stripe
- Infrastructure: Render.com deployment

Provide concise, actionable error analysis focusing on immediate resolution steps.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.1,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildOpenAIPrompt(error) }
      ]
    });

    return this.parseOpenAIResponse(response.choices[0].message.content);
  }

  buildOpenAIPrompt(error) {
    return `
Analyze this error from the Alii Fish Market Toast POS replacement system:

ERROR: ${error.message}
TYPE: ${error.type}
SEVERITY: ${error.severity}
SERVICE: ${error.context.service}
STACK: ${error.stackTrace || 'N/A'}

Provide:
1. Quick diagnosis
2. Immediate fix steps
3. Code changes needed
4. Testing approach
5. Monitoring improvements

Keep responses concise and actionable.
`;
  }

  synthesizeAnalyses(claudeAnalysis, openaiAnalysis, error) {
    return {
      id: error.id,
      timestamp: new Date().toISOString(),
      error: {
        type: error.type,
        severity: error.severity,
        message: error.message,
        service: error.context.service,
        filePath: error.filePath
      },
      analysis: {
        claude: claudeAnalysis,
        openai: openaiAnalysis,
        consensus: this.findConsensus(claudeAnalysis, openaiAnalysis),
        confidence: this.calculateConfidence(claudeAnalysis, openaiAnalysis)
      },
      recommendations: {
        immediate: this.extractImmediateActions(claudeAnalysis, openaiAnalysis),
        codeChanges: this.extractCodeChanges(claudeAnalysis, openaiAnalysis),
        testing: this.extractTestingSteps(claudeAnalysis, openaiAnalysis),
        monitoring: this.extractMonitoringImprovements(claudeAnalysis, openaiAnalysis)
      },
      priority: this.calculatePriority(error, claudeAnalysis, openaiAnalysis),
      estimatedFixTime: this.estimateFixTime(claudeAnalysis, openaiAnalysis),
      affectedComponents: this.identifyAffectedComponents(error, claudeAnalysis, openaiAnalysis),
      businessImpact: this.assessBusinessImpact(error, claudeAnalysis, openaiAnalysis)
    };
  }

  parseClaudeResponse(response) {
    // Parse Claude's structured response
    try {
      const sections = {
        rootCause: this.extractSection(response, 'Root Cause', 'Impact'),
        impact: this.extractSection(response, 'Impact', 'Urgency'),
        urgency: this.extractSection(response, 'Urgency', 'Fix Recommendations'),
        fixRecommendations: this.extractSection(response, 'Fix Recommendations', 'Prevention'),
        prevention: this.extractSection(response, 'Prevention', 'Related Code'),
        relatedCode: this.extractSection(response, 'Related Code', null)
      };

      return {
        provider: 'claude',
        analysis: sections,
        confidence: this.assessResponseQuality(response),
        rawResponse: response
      };
    } catch (err) {
      return {
        provider: 'claude',
        analysis: { summary: response },
        confidence: 0.5,
        rawResponse: response
      };
    }
  }

  parseOpenAIResponse(response) {
    try {
      const sections = {
        diagnosis: this.extractSection(response, '1.', '2.'),
        fixSteps: this.extractSection(response, '2.', '3.'),
        codeChanges: this.extractSection(response, '3.', '4.'),
        testing: this.extractSection(response, '4.', '5.'),
        monitoring: this.extractSection(response, '5.', null)
      };

      return {
        provider: 'openai',
        analysis: sections,
        confidence: this.assessResponseQuality(response),
        rawResponse: response
      };
    } catch (err) {
      return {
        provider: 'openai',
        analysis: { summary: response },
        confidence: 0.5,
        rawResponse: response
      };
    }
  }

  extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';

    const start = startIndex + startMarker.length;
    const endIndex = endMarker ? text.indexOf(endMarker, start) : text.length;
    
    return text.substring(start, endIndex === -1 ? text.length : endIndex).trim();
  }

  findConsensus(claudeAnalysis, openaiAnalysis) {
    // Find common themes and recommendations
    const commonThemes = [];
    
    // Simple keyword matching for consensus (can be made more sophisticated)
    const claudeText = claudeAnalysis.rawResponse.toLowerCase();
    const openaiText = openaiAnalysis.rawResponse.toLowerCase();
    
    const keywords = ['database', 'connection', 'timeout', 'null', 'api', 'payment', 'authentication'];
    
    keywords.forEach(keyword => {
      if (claudeText.includes(keyword) && openaiText.includes(keyword)) {
        commonThemes.push(keyword);
      }
    });
    
    return {
      agreement: commonThemes.length / keywords.length,
      commonThemes,
      divergentPoints: this.findDivergentPoints(claudeAnalysis, openaiAnalysis)
    };
  }

  findDivergentPoints(claudeAnalysis, openaiAnalysis) {
    // Identify where the analyses differ
    return {
      claude_unique: ['Detailed context analysis', 'Business impact assessment'],
      openai_unique: ['Concise fix steps', 'Quick implementation path']
    };
  }

  calculateConfidence(claudeAnalysis, openaiAnalysis) {
    const claudeConf = claudeAnalysis.confidence || 0.7;
    const openaiConf = openaiAnalysis.confidence || 0.7;
    const consensus = this.findConsensus(claudeAnalysis, openaiAnalysis);
    
    return (claudeConf + openaiConf + consensus.agreement) / 3;
  }

  extractImmediateActions(claudeAnalysis, openaiAnalysis) {
    const actions = [];
    
    // Extract immediate actions from both analyses
    if (claudeAnalysis.analysis.urgency) {
      actions.push(`Claude: ${claudeAnalysis.analysis.urgency}`);
    }
    
    if (openaiAnalysis.analysis.fixSteps) {
      actions.push(`OpenAI: ${openaiAnalysis.analysis.fixSteps}`);
    }
    
    return actions;
  }

  extractCodeChanges(claudeAnalysis, openaiAnalysis) {
    const changes = [];
    
    if (claudeAnalysis.analysis.fixRecommendations) {
      changes.push({
        source: 'claude',
        changes: claudeAnalysis.analysis.fixRecommendations
      });
    }
    
    if (openaiAnalysis.analysis.codeChanges) {
      changes.push({
        source: 'openai', 
        changes: openaiAnalysis.analysis.codeChanges
      });
    }
    
    return changes;
  }

  extractTestingSteps(claudeAnalysis, openaiAnalysis) {
    const steps = [];
    
    if (openaiAnalysis.analysis.testing) {
      steps.push(openaiAnalysis.analysis.testing);
    }
    
    return steps;
  }

  extractMonitoringImprovements(claudeAnalysis, openaiAnalysis) {
    const improvements = [];
    
    if (claudeAnalysis.analysis.prevention) {
      improvements.push(claudeAnalysis.analysis.prevention);
    }
    
    if (openaiAnalysis.analysis.monitoring) {
      improvements.push(openaiAnalysis.analysis.monitoring);
    }
    
    return improvements;
  }

  calculatePriority(error, claudeAnalysis, openaiAnalysis) {
    let priority = 3; // Default medium priority
    
    // Severity-based priority
    if (error.severity === 'critical') priority = 1;
    else if (error.severity === 'high') priority = 2;
    else if (error.severity === 'low') priority = 4;
    
    // Payment system errors get higher priority
    if (error.type === 'payment') priority = Math.max(1, priority - 1);
    
    // Database errors get higher priority
    if (error.type === 'database') priority = Math.max(1, priority - 1);
    
    return priority;
  }

  estimateFixTime(claudeAnalysis, openaiAnalysis) {
    // Simple heuristic-based time estimation
    const complexity = this.assessComplexity(claudeAnalysis, openaiAnalysis);
    
    if (complexity === 'low') return '30 minutes - 2 hours';
    if (complexity === 'medium') return '2 hours - 1 day';
    if (complexity === 'high') return '1-3 days';
    if (complexity === 'critical') return '3-7 days';
    
    return '2-4 hours';
  }

  assessComplexity(claudeAnalysis, openaiAnalysis) {
    const complexityKeywords = {
      low: ['typo', 'configuration', 'missing import'],
      medium: ['logic error', 'validation', 'api integration'],
      high: ['database schema', 'architecture', 'security'],
      critical: ['data corruption', 'payment failure', 'system crash']
    };
    
    const text = `${claudeAnalysis.rawResponse} ${openaiAnalysis.rawResponse}`.toLowerCase();
    
    for (const [level, keywords] of Object.entries(complexityKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return level;
      }
    }
    
    return 'medium';
  }

  identifyAffectedComponents(error, claudeAnalysis, openaiAnalysis) {
    const components = new Set();
    
    // Based on error context
    if (error.context.service === 'frontend') components.add('React Frontend');
    if (error.context.service === 'backend') components.add('Spring Boot API');
    if (error.type === 'database') components.add('PostgreSQL Database');
    if (error.type === 'payment') components.add('UPP Payment System');
    
    // Based on analysis content
    const analysisText = `${claudeAnalysis.rawResponse} ${openaiAnalysis.rawResponse}`.toLowerCase();
    
    if (analysisText.includes('stripe')) components.add('Stripe Integration');
    if (analysisText.includes('staff')) components.add('Staff Mobile App');
    if (analysisText.includes('dashboard')) components.add('Business Dashboard');
    if (analysisText.includes('order')) components.add('Order Management');
    
    return Array.from(components);
  }

  assessBusinessImpact(error, claudeAnalysis, openaiAnalysis) {
    const impact = {
      revenue: 'low',
      operations: 'low',
      reputation: 'low',
      compliance: 'low'
    };
    
    // High impact scenarios
    if (error.type === 'payment') {
      impact.revenue = 'high';
      impact.operations = 'high';
    }
    
    if (error.severity === 'critical') {
      impact.operations = 'high';
      impact.reputation = 'medium';
    }
    
    if (error.type === 'security') {
      impact.compliance = 'high';
      impact.reputation = 'high';
    }
    
    return impact;
  }

  assessResponseQuality(response) {
    // Simple quality assessment based on response characteristics
    const length = response.length;
    const hasCodeExamples = response.includes('```') || response.includes('`');
    const hasStructuredSections = response.includes('1.') || response.includes('-');
    
    let quality = 0.5;
    
    if (length > 500) quality += 0.2;
    if (hasCodeExamples) quality += 0.2;
    if (hasStructuredSections) quality += 0.1;
    
    return Math.min(quality, 1.0);
  }

  getRelevantContext(error) {
    // Return relevant codebase context based on error type
    let context = '';
    
    if (error.type === 'payment') {
      context += 'Payment processing context:\n';
      context += '- UPP integration for universal payments\n';
      context += '- Stripe fallback processing\n';
      context += '- NFC, QR, voice payment methods\n';
    }
    
    if (error.context.service === 'backend') {
      const javaContent = this.codebaseContext.get('../../backend/src/main/java/com/aliifishmarket/AliiFishMarketApplication.java');
      if (javaContent) {
        context += '\nMain Application Structure:\n';
        context += javaContent.substring(0, 1000) + '...\n';
      }
    }
    
    return context;
  }

  generateCacheKey(error) {
    return `${error.type}_${error.severity}_${error.message.substring(0, 50).replace(/\s+/g, '_')}`;
  }

  fallbackAnalysis(error) {
    return {
      id: error.id,
      timestamp: new Date().toISOString(),
      error: {
        type: error.type,
        severity: error.severity,
        message: error.message,
        service: error.context.service
      },
      analysis: {
        provider: 'fallback',
        summary: 'AI analysis failed, using rule-based fallback',
        confidence: 0.3
      },
      recommendations: {
        immediate: ['Check logs for more details', 'Verify service health'],
        codeChanges: ['Manual code review required'],
        testing: ['Run existing test suite'],
        monitoring: ['Add more detailed logging']
      },
      priority: 3,
      estimatedFixTime: 'Manual assessment required'
    };
  }
}

module.exports = AIErrorAnalyzer;