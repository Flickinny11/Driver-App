import { AgentWorkerBase } from '@/workers/AgentWorkerBase';
import type { Task, ComponentRequirements } from '@/types';

/**
 * Frontend Architect Agent specializing in React/TypeScript component creation
 * Generates production-ready frontend components with proper architecture
 */
class FrontendArchitectAgent extends AgentWorkerBase {
  private readonly CONTEXT_LIMIT = 100000; // tokens

  /**
   * Execute a frontend architecture task
   */
  protected async executeTask(task: Task): Promise<void> {
    try {
      console.log(`🎨 Frontend Architect starting task: ${task.title}`);
      
      switch (task.type) {
        case 'frontend-architect':
          await this.handleFrontendTask(task);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }
    } catch (error) {
      this.sendMessage('error', { 
        error: error instanceof Error ? error.message : String(error),
        taskId: task.id 
      });
    }
  }

  /**
   * Handle frontend-specific tasks
   */
  private async handleFrontendTask(task: Task): Promise<void> {
    const requirements = task.requirements as ComponentRequirements;
    
    this.sendMessage('progress', { progress: 10 });

    // Check context usage before proceeding
    if (this.contextWindow.getUsage() > this.CONTEXT_LIMIT * 0.8) {
      this.sendMessage('contextLimitApproaching', {
        usage: this.contextWindow.getUsage()
      });
    }

    // Generate component based on requirements
    const componentCode = await this.generateComponentCode(requirements);
    
    this.sendMessage('progress', { progress: 60 });

    // Validate the generated code
    const validation = await this.validateCode(componentCode);
    
    this.sendMessage('progress', { progress: 80 });

    let finalCode = componentCode;
    if (!validation.isValid) {
      console.log('🔧 Code validation failed, fixing issues...');
      finalCode = await this.fixCode(componentCode, validation.issues);
    }

    // Send file update
    this.sendMessage('fileUpdate', {
      path: requirements.outputPath || `src/components/${requirements.name}.tsx`,
      content: finalCode,
      language: 'typescript',
      type: 'component'
    });

    this.sendMessage('progress', { progress: 100 });

    // Mark task as complete
    this.sendMessage('complete', {
      result: {
        componentName: requirements.name,
        filePath: requirements.outputPath,
        linesOfCode: finalCode.split('\n').length,
        features: requirements.features
      }
    });
  }

  /**
   * Generate production-ready component code
   */
  private async generateComponentCode(req: ComponentRequirements): Promise<string> {
    const prompt = this.buildComponentPrompt(req);
    
    const response = await this.callOpenRouter({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{
        role: 'system',
        content: `You are a Frontend Architect specializing in ${req.framework || 'React'}.
                  Generate PRODUCTION-READY component code.
                  
                  Requirements:
                  - NO placeholders or TODOs
                  - Complete implementation
                  - Proper error handling  
                  - Full TypeScript types
                  - Accessibility compliant
                  - Performance optimized
                  - Clean, maintainable code
                  - Modern best practices
                  
                  Return ONLY the component code, no explanations.`
      }, {
        role: 'user',
        content: prompt
      }],
      temperature: 0.3,
      max_tokens: 3000
    });

    return this.extractCodeFromResponse(response.content);
  }

  /**
   * Build a detailed prompt for component generation
   */
  private buildComponentPrompt(req: ComponentRequirements): string {
    return `Create a ${req.framework || 'React'} component with these specifications:

Component Name: ${req.name}
Type: ${req.type || 'functional'}
Features: ${req.features?.join(', ') || 'basic functionality'}
Styling: ${req.styling || 'CSS modules'}
Dependencies: ${req.dependencies?.join(', ') || 'none'}

Requirements:
- TypeScript with strict typing
- Responsive design
- Error boundaries where appropriate
- Loading states
- Accessibility (ARIA labels, keyboard navigation)
- Performance optimizations (memo, useMemo, useCallback where needed)
- Clean props interface
- JSDoc comments for public APIs
- Modern React patterns (hooks, context where appropriate)

The component should be ready for production use with no placeholder code.`;
  }

  /**
   * Extract code from OpenRouter response
   */
  private extractCodeFromResponse(content: string): string {
    // Remove markdown code blocks if present
    const codeMatch = content.match(/```(?:typescript|tsx|javascript|jsx)?\n([\s\S]*?)\n```/);
    if (codeMatch) {
      return codeMatch[1].trim();
    }
    
    // If no code blocks, return the content as-is
    return content.trim();
  }

  /**
   * Validate the generated code
   */
  private async validateCode(code: string): Promise<ValidationResult> {
    const issues: string[] = [];

    // Basic syntax checks
    if (code.includes('TODO') || code.includes('FIXME')) {
      issues.push('Code contains TODO or FIXME comments');
    }

    if (code.includes('placeholder') || code.includes('...')) {
      issues.push('Code contains placeholder content');
    }

    // Check for TypeScript interfaces
    if (!code.includes('interface ') && !code.includes('type ')) {
      issues.push('No TypeScript types defined');
    }

    // Check for proper exports
    if (!code.includes('export ')) {
      issues.push('Component is not exported');
    }

    // Check for React imports
    if (code.includes('React.') && !code.includes('import React')) {
      issues.push('React not imported but used');
    }

    // Check for basic accessibility
    if (code.includes('<button') && !code.includes('aria-')) {
      issues.push('Interactive elements missing accessibility attributes');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Fix issues in the generated code
   */
  private async fixCode(code: string, issues: string[]): Promise<string> {
    const fixPrompt = `Fix these issues in the following React component code:

Issues to fix:
${issues.map(issue => `- ${issue}`).join('\n')}

Original code:
\`\`\`typescript
${code}
\`\`\`

Return the corrected code with all issues resolved. The code must be production-ready.`;

    const response = await this.callOpenRouter({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{
        role: 'system',
        content: 'You are a code reviewer fixing issues in React components. Return only the corrected code.'
      }, {
        role: 'user',
        content: fixPrompt
      }],
      temperature: 0.2,
      max_tokens: 3000
    });

    return this.extractCodeFromResponse(response.content);
  }
}

interface ValidationResult {
  isValid: boolean;
  issues: string[];
}

// Initialize the worker
new FrontendArchitectAgent();