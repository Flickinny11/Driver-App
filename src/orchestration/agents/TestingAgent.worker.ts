import { AgentWorkerBase } from '@/workers/AgentWorkerBase';
import type { Task } from '@/types';

/**
 * Testing Specialist Agent for comprehensive test generation
 */
class TestingAgent extends AgentWorkerBase {
  protected async executeTask(task: Task): Promise<void> {
    try {
      console.log(`🧪 Testing Specialist starting task: ${task.title}`);
      
      this.sendMessage('progress', { progress: 15 });

      const testCode = await this.generateTestCode(task);
      
      this.sendMessage('progress', { progress: 90 });

      this.sendMessage('fileUpdate', {
        path: `tests/${task.title.toLowerCase().replace(/\s+/g, '-')}.test.js`,
        content: testCode,
        language: 'javascript',
        type: 'test'
      });

      this.sendMessage('progress', { progress: 100 });
      this.sendMessage('complete', {
        result: {
          type: 'testing',
          testCount: (testCode.match(/test\(|it\(/g) || []).length,
          linesOfCode: testCode.split('\n').length
        }
      });
    } catch (error) {
      this.sendMessage('error', { 
        error: error instanceof Error ? error.message : String(error),
        taskId: task.id 
      });
    }
  }

  private async generateTestCode(task: Task): Promise<string> {
    const response = await this.callOpenRouter({
      model: 'openai/gpt-4o', // Updated to current model for testing specialist
      messages: [{
        role: 'system',
        content: `You are a Testing Specialist. Generate comprehensive test suites.
                  Include unit tests, integration tests, and edge cases.
                  Use Jest/Vitest framework. NO placeholders, complete implementation.`
      }, {
        role: 'user',
        content: `Generate tests for: ${JSON.stringify(task)}`
      }],
      temperature: 0.2,
      max_tokens: 3000
    });

    return this.extractCodeFromResponse(response.content);
  }

  private extractCodeFromResponse(content: string): string {
    const codeMatch = content.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : content.trim();
  }
}

new TestingAgent();