import { AgentWorkerBase } from '@/workers/AgentWorkerBase';
import type { Task } from '@/types';

/**
 * Backend Engineer Agent specializing in server-side development
 */
class BackendEngineerAgent extends AgentWorkerBase {
  /**
   * Execute a backend engineering task
   */
  protected async executeTask(task: Task): Promise<void> {
    try {
      console.log(`⚙️ Backend Engineer starting task: ${task.title}`);
      
      this.sendMessage('progress', { progress: 10 });

      const code = await this.generateBackendCode(task);
      
      this.sendMessage('progress', { progress: 80 });

      // Send file update
      this.sendMessage('fileUpdate', {
        path: `server/${task.title.toLowerCase().replace(/\s+/g, '-')}.js`,
        content: code,
        language: 'javascript',
        type: 'server'
      });

      this.sendMessage('progress', { progress: 100 });
      this.sendMessage('complete', {
        result: {
          type: 'backend',
          linesOfCode: code.split('\n').length
        }
      });
    } catch (error) {
      this.sendMessage('error', { 
        error: error instanceof Error ? error.message : String(error),
        taskId: task.id 
      });
    }
  }

  private async generateBackendCode(task: Task): Promise<string> {
    const response = await this.callOpenRouter({
      model: 'openai/gpt-4o', // Using GPT-4o for backend engineering as per AgentPool mapping
      messages: [{
        role: 'system',
        content: `You are a Backend Engineer. Generate production-ready server code.
                  Requirements: NO placeholders, complete implementation, proper error handling.`
      }, {
        role: 'user',
        content: JSON.stringify(task)
      }],
      temperature: 0.3,
      max_tokens: 3000
    });

    return this.extractCodeFromResponse(response.content);
  }

  private extractCodeFromResponse(content: string): string {
    const codeMatch = content.match(/```(?:javascript|js|typescript|ts)?\n([\s\S]*?)\n```/);
    return codeMatch ? codeMatch[1].trim() : content.trim();
  }
}

new BackendEngineerAgent();