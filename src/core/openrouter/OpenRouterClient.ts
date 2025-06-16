import OpenAI from 'openai';
import type { Message } from '@/types';

/**
 * OpenRouter client for connecting to multiple AI models through OpenRouter's API
 * Supports streaming responses and model management
 */
export class OpenRouterClient {
  private clients: Map<string, OpenAI> = new Map();
  private readonly BASE_URL = 'https://openrouter.ai/api/v1';
  private readonly supportedModels = [
    'anthropic/claude-3.5-sonnet',
    'mistralai/mistral-large',
    'meta-llama/llama-3.1-405b',
    'meta-llama/llama-3.1-70b', 
    'openai/gpt-4-turbo',
    'google/gemini-pro-1.5'
  ];

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }
    this.initializeModels();
  }

  /**
   * Initialize OpenAI clients for each supported model
   */
  private initializeModels(): void {
    this.supportedModels.forEach(model => {
      try {
        const client = new OpenAI({
          apiKey: this.apiKey,
          baseURL: this.BASE_URL,
          defaultHeaders: {
            'HTTP-Referer': process.env.NODE_ENV === 'production' 
              ? 'https://flickinny11.github.io/Driver-App/' 
              : 'http://localhost:5173',
            'X-Title': 'Driver AI Platform'
          },
          dangerouslyAllowBrowser: true
        });

        this.clients.set(model, client);
      } catch (error) {
        console.error(`Failed to initialize client for model ${model}:`, error);
      }
    });
  }

  /**
   * Get available models
   */
  getAvailableModels(): string[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if a model is supported
   */
  isModelSupported(model: string): boolean {
    return this.clients.has(model);
  }

  /**
   * Stream completion from the specified model
   */
  async streamCompletion(
    model: string,
    messages: Message[],
    onToken: (token: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const client = this.clients.get(model);
    if (!client) {
      const error = new Error(`Model ${model} not initialized`);
      onError?.(error);
      throw error;
    }

    try {
      // Convert our Message format to OpenAI format
      const openAIMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      const stream = await client.chat.completions.create(
        {
          model,
          messages: openAIMessages,
          stream: true,
          temperature: 0.7,
          max_tokens: 4096,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        { signal }
      );

      for await (const chunk of stream) {
        if (signal?.aborted) {
          break;
        }

        const token = chunk.choices[0]?.delta?.content || '';
        if (token) {
          onToken(token);
        }

        // Check if stream is finished
        if (chunk.choices[0]?.finish_reason) {
          onComplete?.();
          break;
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }

      console.error(`Error in streamCompletion for model ${model}:`, error);
      onError?.(error instanceof Error ? error : new Error('Unknown error occurred'));
      throw error;
    }
  }

  /**
   * Get a non-streaming completion
   */
  async getCompletion(
    model: string,
    messages: Message[],
    signal?: AbortSignal
  ): Promise<string> {
    const client = this.clients.get(model);
    if (!client) {
      throw new Error(`Model ${model} not initialized`);
    }

    try {
      const openAIMessages = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
      }));

      const response = await client.chat.completions.create(
        {
          model,
          messages: openAIMessages,
          temperature: 0.7,
          max_tokens: 4096
        },
        { signal }
      );

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error(`Error in getCompletion for model ${model}:`, error);
      throw error;
    }
  }

  /**
   * Get model information
   */
  async getModelInfo(model: string): Promise<any> {
    const client = this.clients.get(model);
    if (!client) {
      throw new Error(`Model ${model} not initialized`);
    }

    try {
      // OpenRouter provides model info through their API
      const response = await fetch(`${this.BASE_URL}/models/${model}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NODE_ENV === 'production' 
            ? 'https://flickinny11.github.io/Driver-App/' 
            : 'http://localhost:5173',
          'X-Title': 'Driver AI Platform'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error(`Error getting model info for ${model}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to OpenRouter
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.BASE_URL}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': process.env.NODE_ENV === 'production' 
            ? 'https://flickinny11.github.io/Driver-App/' 
            : 'http://localhost:5173',
          'X-Title': 'Driver AI Platform'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to test OpenRouter connection:', error);
      return false;
    }
  }

  /**
   * Dispose of all clients and cleanup
   */
  dispose(): void {
    this.clients.clear();
  }
}