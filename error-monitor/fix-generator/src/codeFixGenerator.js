const fs = require('fs').promises;
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');

class CodeFixGenerator {
  constructor(config) {
    this.config = config;
    
    this.claude = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.projectRoot = config.projectRoot || '../..';
    this.fixTemplates = this.loadFixTemplates();
    this.codebaseMap = new Map();
    this.buildCodebaseMap();
  }

  async buildCodebaseMap() {
    const extensions = ['.js', '.ts', '.tsx', '.java', '.yml', '.yaml', '.json'];
    await this.scanDirectory(this.projectRoot, extensions);
  }

  async scanDirectory(dir, extensions) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          await this.scanDirectory(fullPath, extensions);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            this.codebaseMap.set(fullPath, {
              content,
              lastModified: (await fs.stat(fullPath)).mtime,
              size: content.length
            });
          } catch (err) {
            console.warn(`Could not read file: ${fullPath}`);
          }
        }
      }
    } catch (err) {
      console.warn(`Could not scan directory: ${dir}`);
    }
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.git', '.next', 'target', 'logs', '.idea'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  loadFixTemplates() {
    return {
      nullPointerException: {
        pattern: /NullPointerException|Cannot read propert.*of null|Cannot read propert.*of undefined/,
        template: 'Add null checks and defensive programming'
      },
      databaseConnection: {
        pattern: /Connection.*refused|Connection.*timeout|Database.*unavailable/,
        template: 'Add connection retry logic and health checks'
      },
      apiTimeout: {
        pattern: /Timeout|Request.*timeout|Connection.*timeout/,
        template: 'Increase timeout values and add retry mechanisms'
      },
      paymentFailure: {
        pattern: /Payment.*failed|UPP.*error|Stripe.*error/,
        template: 'Add payment error handling and fallback options'
      },
      validationError: {
        pattern: /Validation.*failed|Invalid.*input|Required.*field/,
        template: 'Improve input validation and error messages'
      }
    };
  }

  async generateFix(errorAnalysis) {
    try {
      // Generate multiple fix approaches
      const approaches = await Promise.all([
        this.generateClaudeFix(errorAnalysis),
        this.generateOpenAIFix(errorAnalysis),
        this.generateTemplateFix(errorAnalysis)
      ]);

      // Find relevant files for the fix
      const relevantFiles = await this.findRelevantFiles(errorAnalysis);

      // Generate specific code changes
      const codeChanges = await this.generateCodeChanges(errorAnalysis, approaches, relevantFiles);

      // Create test cases for the fix
      const testCases = await this.generateTestCases(errorAnalysis, codeChanges);

      return {
        id: `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        errorId: errorAnalysis.id,
        approaches,
        recommendedApproach: this.selectBestApproach(approaches),
        relevantFiles,
        codeChanges,
        testCases,
        estimatedImpact: this.assessFixImpact(codeChanges),
        rollbackPlan: this.createRollbackPlan(codeChanges),
        validation: {
          automated: true,
          manual: this.requiresManualValidation(errorAnalysis),
          testCoverage: testCases.length > 0
        }
      };
    } catch (err) {
      console.error('Error generating fix:', err);
      return this.generateFallbackFix(errorAnalysis);
    }
  }

  async generateClaudeFix(errorAnalysis) {
    const systemPrompt = `You are an expert software engineer specializing in automated code fixes for the Alii Fish Market application - a Toast POS replacement system.

Your task is to generate precise, working code fixes based on error analysis. The fixes must:
1. Resolve the specific error
2. Follow existing code patterns
3. Include proper error handling
4. Be production-ready
5. Include comments explaining the fix

System context:
- Frontend: Next.js/React with TypeScript
- Backend: Spring Boot with Java
- Database: PostgreSQL
- Payment: UPP + Stripe integration
- Deployment: Render.com

Provide the fix as structured output with:
- Specific file paths
- Exact code changes (with line numbers if possible)
- Explanation of the fix
- Potential side effects
- Testing recommendations`;

    const userPrompt = this.buildFixPrompt(errorAnalysis);

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

    return {
      provider: 'claude',
      approach: 'comprehensive',
      fix: this.parseClaudeFixResponse(response.content[0].text),
      confidence: 0.85,
      reasoning: 'Claude provides detailed context-aware fixes with comprehensive error handling'
    };
  }

  async generateOpenAIFix(errorAnalysis) {
    const systemPrompt = `You are a senior software engineer creating automated fixes for the Alii Fish Market Toast POS replacement system.

Generate specific, implementable code fixes that:
- Address the root cause
- Follow best practices
- Include error handling
- Are ready for production deployment

System: Next.js frontend + Spring Boot backend + PostgreSQL + UPP payments`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      temperature: 0.1,
      max_tokens: 3000,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: this.buildFixPrompt(errorAnalysis) }
      ]
    });

    return {
      provider: 'openai',
      approach: 'focused',
      fix: this.parseOpenAIFixResponse(response.choices[0].message.content),
      confidence: 0.80,
      reasoning: 'OpenAI provides focused, practical fixes with clear implementation steps'
    };
  }

  generateTemplateFix(errorAnalysis) {
    const error = errorAnalysis.error;
    
    // Match against known fix templates
    for (const [templateName, template] of Object.entries(this.fixTemplates)) {
      if (template.pattern.test(error.message)) {
        return {
          provider: 'template',
          approach: 'pattern-based',
          fix: {
            description: template.template,
            category: templateName,
            standardFix: true
          },
          confidence: 0.60,
          reasoning: 'Template-based fix using known error patterns'
        };
      }
    }

    return {
      provider: 'template',
      approach: 'generic',
      fix: {
        description: 'Generic error handling improvement needed',
        category: 'unknown',
        standardFix: false
      },
      confidence: 0.30,
      reasoning: 'No specific template match found'
    };
  }

  buildFixPrompt(errorAnalysis) {
    const relevantCode = this.getRelevantCodeContext(errorAnalysis);
    
    return `
## Error Analysis Summary
${JSON.stringify(errorAnalysis.error, null, 2)}

## AI Analysis Results
**Claude Analysis:** ${errorAnalysis.analysis.claude?.analysis?.rootCause || 'N/A'}
**OpenAI Analysis:** ${errorAnalysis.analysis.openai?.analysis?.diagnosis || 'N/A'}
**Priority:** ${errorAnalysis.priority}
**Estimated Fix Time:** ${errorAnalysis.estimatedFixTime}
**Affected Components:** ${errorAnalysis.affectedComponents.join(', ')}

## Current Code Context
${relevantCode}

## Fix Requirements
1. Generate specific code changes to resolve this error
2. Include file paths and line numbers where possible
3. Add proper error handling and logging
4. Ensure compatibility with existing codebase
5. Include validation and testing suggestions

Focus on:
- Payment processing reliability (critical for business)
- Customer experience (order flow integrity)
- System stability (prevent cascading failures)
- Performance impact (minimal overhead)

Provide the fix in this format:
```
FILES_TO_MODIFY:
- path/to/file1.java: [description of changes]
- path/to/file2.ts: [description of changes]

CODE_CHANGES:
[Specific code blocks with before/after examples]

TESTING:
[How to test the fix]

DEPLOYMENT_NOTES:
[Any special deployment considerations]
```
`;
  }

  getRelevantCodeContext(errorAnalysis) {
    const service = errorAnalysis.error.service;
    const errorType = errorAnalysis.error.type;
    
    // Find relevant files based on service and error type
    const relevantFiles = [];
    
    for (const [filePath, fileInfo] of this.codebaseMap) {
      if (this.isRelevantFile(filePath, service, errorType)) {
        relevantFiles.push({
          path: filePath,
          snippet: fileInfo.content.substring(0, 1000) // First 1000 chars
        });
        
        if (relevantFiles.length >= 3) break; // Limit context size
      }
    }
    
    return relevantFiles.map(file => 
      `\n=== ${file.path} ===\n${file.snippet}...\n`
    ).join('\n');
  }

  isRelevantFile(filePath, service, errorType) {
    const lowerPath = filePath.toLowerCase();
    
    // Service-based relevance
    if (service === 'backend' && lowerPath.includes('backend')) return true;
    if (service === 'frontend' && lowerPath.includes('frontend')) return true;
    
    // Error type-based relevance
    if (errorType === 'payment' && (lowerPath.includes('payment') || lowerPath.includes('upp') || lowerPath.includes('stripe'))) return true;
    if (errorType === 'database' && (lowerPath.includes('repository') || lowerPath.includes('model') || lowerPath.includes('entity'))) return true;
    if (errorType === 'api' && (lowerPath.includes('controller') || lowerPath.includes('service') || lowerPath.includes('api'))) return true;
    
    // Configuration files
    if (lowerPath.includes('application.yml') || lowerPath.includes('package.json') || lowerPath.includes('pom.xml')) return true;
    
    return false;
  }

  async findRelevantFiles(errorAnalysis) {
    const files = [];
    const service = errorAnalysis.error.service;
    const errorType = errorAnalysis.error.type;
    
    for (const [filePath, fileInfo] of this.codebaseMap) {
      if (this.isRelevantFile(filePath, service, errorType)) {
        files.push({
          path: filePath,
          relevanceScore: this.calculateRelevanceScore(filePath, errorAnalysis),
          size: fileInfo.size,
          lastModified: fileInfo.lastModified
        });
      }
    }
    
    // Sort by relevance and return top 10
    return files.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 10);
  }

  calculateRelevanceScore(filePath, errorAnalysis) {
    let score = 0;
    const lowerPath = filePath.toLowerCase();
    const errorMessage = errorAnalysis.error.message.toLowerCase();
    
    // Direct file mention in error
    if (errorMessage.includes(path.basename(filePath).toLowerCase())) score += 100;
    
    // Service match
    if (errorAnalysis.error.service === 'backend' && lowerPath.includes('backend')) score += 50;
    if (errorAnalysis.error.service === 'frontend' && lowerPath.includes('frontend')) score += 50;
    
    // Error type match
    if (errorAnalysis.error.type === 'payment' && lowerPath.includes('payment')) score += 40;
    if (errorAnalysis.error.type === 'database' && lowerPath.includes('repository')) score += 40;
    
    // File type preferences
    if (lowerPath.endsWith('.java') && errorAnalysis.error.service === 'backend') score += 30;
    if (lowerPath.endsWith('.tsx') && errorAnalysis.error.service === 'frontend') score += 30;
    
    return score;
  }

  async generateCodeChanges(errorAnalysis, approaches, relevantFiles) {
    const changes = [];
    
    // Extract code changes from AI approaches
    for (const approach of approaches) {
      if (approach.fix && approach.fix.codeChanges) {
        const parsedChanges = this.parseCodeChanges(approach.fix, relevantFiles);
        changes.push(...parsedChanges);
      }
    }
    
    // Deduplicate and merge similar changes
    return this.deduplicateChanges(changes);
  }

  parseCodeChanges(fix, relevantFiles) {
    const changes = [];
    
    if (typeof fix === 'string') {
      // Parse structured fix response
      const fileMatches = fix.match(/FILES_TO_MODIFY:\s*(.*?)(?=CODE_CHANGES:|$)/s);
      const codeMatches = fix.match(/CODE_CHANGES:\s*(.*?)(?=TESTING:|DEPLOYMENT_NOTES:|$)/s);
      
      if (fileMatches && codeMatches) {
        const fileLines = fileMatches[1].trim().split('\n');
        
        for (const fileLine of fileLines) {
          const match = fileLine.match(/^-\s*(.+?):\s*(.+)$/);
          if (match) {
            const [, filePath, description] = match;
            
            changes.push({
              filePath: this.resolveFilePath(filePath),
              changeType: 'modify',
              description,
              codeBlock: this.extractCodeBlockForFile(codeMatches[1], filePath),
              priority: this.getChangePriority(description)
            });
          }
        }
      }
    }
    
    return changes;
  }

  extractCodeBlockForFile(codeSection, targetFile) {
    // Extract relevant code blocks for the specific file
    const lines = codeSection.split('\n');
    const codeBlock = [];
    let inTargetSection = false;
    
    for (const line of lines) {
      if (line.includes(path.basename(targetFile)) || line.includes(targetFile)) {
        inTargetSection = true;
      } else if (inTargetSection && (line.startsWith('```') || line.includes('==='))) {
        break;
      }
      
      if (inTargetSection) {
        codeBlock.push(line);
      }
    }
    
    return codeBlock.join('\n');
  }

  resolveFilePath(partialPath) {
    // Convert relative or partial paths to absolute paths
    if (path.isAbsolute(partialPath)) {
      return partialPath;
    }
    
    // Search for matching files in codebase
    for (const filePath of this.codebaseMap.keys()) {
      if (filePath.endsWith(partialPath) || filePath.includes(partialPath)) {
        return filePath;
      }
    }
    
    return path.join(this.projectRoot, partialPath);
  }

  getChangePriority(description) {
    const lowPriority = ['comment', 'log', 'documentation'];
    const highPriority = ['payment', 'security', 'critical', 'null check'];
    
    const desc = description.toLowerCase();
    
    if (highPriority.some(keyword => desc.includes(keyword))) return 'high';
    if (lowPriority.some(keyword => desc.includes(keyword))) return 'low';
    
    return 'medium';
  }

  deduplicateChanges(changes) {
    const uniqueChanges = new Map();
    
    for (const change of changes) {
      const key = `${change.filePath}:${change.changeType}`;
      
      if (!uniqueChanges.has(key) || 
          uniqueChanges.get(key).priority < change.priority) {
        uniqueChanges.set(key, change);
      }
    }
    
    return Array.from(uniqueChanges.values());
  }

  async generateTestCases(errorAnalysis, codeChanges) {
    const testCases = [];
    
    for (const change of codeChanges) {
      if (change.priority === 'high' || change.filePath.includes('service') || change.filePath.includes('controller')) {
        testCases.push({
          type: 'unit',
          target: change.filePath,
          description: `Test fix for ${change.description}`,
          testCode: await this.generateTestCode(change, errorAnalysis)
        });
      }
    }
    
    // Add integration test if payment-related
    if (errorAnalysis.error.type === 'payment') {
      testCases.push({
        type: 'integration',
        target: 'payment_flow',
        description: 'End-to-end payment processing test',
        testCode: this.generatePaymentIntegrationTest(errorAnalysis)
      });
    }
    
    return testCases;
  }

  async generateTestCode(change, errorAnalysis) {
    // Simple test generation based on file type and change
    if (change.filePath.endsWith('.java')) {
      return this.generateJavaTest(change, errorAnalysis);
    } else if (change.filePath.endsWith('.ts') || change.filePath.endsWith('.tsx')) {
      return this.generateTypeScriptTest(change, errorAnalysis);
    }
    
    return `// Manual test required for ${change.filePath}`;
  }

  generateJavaTest(change, errorAnalysis) {
    const className = path.basename(change.filePath, '.java');
    return `
@Test
public void test${className}Fix() {
    // Test for fix: ${change.description}
    // Error context: ${errorAnalysis.error.message}
    
    // TODO: Add specific test implementation
    assertNotNull(${className.toLowerCase()}Service);
    // Add assertions based on the fix
}

@Test
public void test${className}ErrorHandling() {
    // Verify error handling improvement
    assertThrows(ExpectedException.class, () -> {
        // Test error conditions
    });
}
`;
  }

  generateTypeScriptTest(change, errorAnalysis) {
    const componentName = path.basename(change.filePath, path.extname(change.filePath));
    return `
describe('${componentName} Fix', () => {
  test('should handle error condition properly', () => {
    // Test for fix: ${change.description}
    // Error context: ${errorAnalysis.error.message}
    
    // TODO: Add specific test implementation
    expect(component).toBeDefined();
    // Add assertions based on the fix
  });
  
  test('should not regress existing functionality', () => {
    // Regression test
    // TODO: Add existing functionality tests
  });
});
`;
  }

  generatePaymentIntegrationTest(errorAnalysis) {
    return `
describe('Payment Integration Fix', () => {
  test('should process UPP payment successfully', async () => {
    const paymentData = {
      amount: 10.00,
      method: 'nfc',
      merchantId: 'alii_fish_market_001'
    };
    
    const result = await processPayment(paymentData);
    expect(result.status).toBe('success');
    expect(result.transactionId).toBeDefined();
  });
  
  test('should handle payment failures gracefully', async () => {
    const invalidPaymentData = { amount: -1 };
    
    await expect(processPayment(invalidPaymentData))
      .rejects.toThrow('Invalid payment amount');
  });
});
`;
  }

  selectBestApproach(approaches) {
    // Select the approach with highest confidence and most detailed fix
    return approaches.reduce((best, current) => {
      const currentScore = current.confidence + (current.fix && current.fix.codeChanges ? 0.2 : 0);
      const bestScore = best.confidence + (best.fix && best.fix.codeChanges ? 0.2 : 0);
      
      return currentScore > bestScore ? current : best;
    });
  }

  assessFixImpact(codeChanges) {
    return {
      filesChanged: codeChanges.length,
      riskLevel: this.calculateRiskLevel(codeChanges),
      affectedFeatures: this.identifyAffectedFeatures(codeChanges),
      rollbackComplexity: this.assessRollbackComplexity(codeChanges),
      testingRequired: codeChanges.some(change => change.priority === 'high')
    };
  }

  calculateRiskLevel(codeChanges) {
    const highRiskFiles = ['Application.java', 'payment', 'database', 'security'];
    const hasHighRiskChanges = codeChanges.some(change => 
      highRiskFiles.some(risk => change.filePath.includes(risk))
    );
    
    if (hasHighRiskChanges) return 'high';
    if (codeChanges.length > 5) return 'medium';
    return 'low';
  }

  identifyAffectedFeatures(codeChanges) {
    const features = new Set();
    
    for (const change of codeChanges) {
      if (change.filePath.includes('payment')) features.add('Payment Processing');
      if (change.filePath.includes('order')) features.add('Order Management');
      if (change.filePath.includes('staff')) features.add('Staff App');
      if (change.filePath.includes('dashboard')) features.add('Business Dashboard');
      if (change.filePath.includes('menu')) features.add('Menu Management');
    }
    
    return Array.from(features);
  }

  assessRollbackComplexity(codeChanges) {
    const complexChanges = codeChanges.filter(change => 
      change.changeType === 'create' || 
      change.description.includes('schema') ||
      change.description.includes('migration')
    );
    
    if (complexChanges.length > 0) return 'high';
    if (codeChanges.length > 3) return 'medium';
    return 'low';
  }

  createRollbackPlan(codeChanges) {
    return {
      backupRequired: true,
      steps: [
        'Create backup of current codebase',
        'Document current system state',
        'Apply fixes incrementally',
        'Test each change separately',
        'Rollback procedure: git revert commits in reverse order'
      ],
      automatedRollback: codeChanges.every(change => change.changeType === 'modify'),
      manualStepsRequired: codeChanges.some(change => 
        change.description.includes('configuration') || 
        change.description.includes('environment')
      )
    };
  }

  requiresManualValidation(errorAnalysis) {
    return errorAnalysis.error.type === 'security' ||
           errorAnalysis.error.type === 'payment' ||
           errorAnalysis.priority === 1;
  }

  parseClaudeFixResponse(response) {
    // Parse Claude's structured response
    return {
      description: this.extractSection(response, 'DESCRIPTION', 'FILES_TO_MODIFY'),
      files: this.extractSection(response, 'FILES_TO_MODIFY', 'CODE_CHANGES'),
      codeChanges: this.extractSection(response, 'CODE_CHANGES', 'TESTING'),
      testing: this.extractSection(response, 'TESTING', 'DEPLOYMENT_NOTES'),
      deploymentNotes: this.extractSection(response, 'DEPLOYMENT_NOTES', null),
      fullResponse: response
    };
  }

  parseOpenAIFixResponse(response) {
    // Parse OpenAI's response
    return {
      description: response.substring(0, response.indexOf('\n\n')),
      codeChanges: response,
      fullResponse: response
    };
  }

  extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';

    const start = startIndex + startMarker.length;
    const endIndex = endMarker ? text.indexOf(endMarker, start) : text.length;
    
    return text.substring(start, endIndex === -1 ? text.length : endIndex).trim();
  }

  generateFallbackFix(errorAnalysis) {
    return {
      id: `fallback_fix_${Date.now()}`,
      timestamp: new Date().toISOString(),
      errorId: errorAnalysis.id,
      approaches: [{
        provider: 'fallback',
        approach: 'manual',
        fix: {
          description: 'Manual fix required - AI generation failed',
          codeChanges: 'Please review error analysis and apply appropriate fix'
        },
        confidence: 0.1
      }],
      recommendedApproach: 'manual',
      codeChanges: [],
      testCases: [],
      validation: {
        automated: false,
        manual: true,
        testCoverage: false
      }
    };
  }
}

module.exports = CodeFixGenerator;