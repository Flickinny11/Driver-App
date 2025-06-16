import { OpenRouterClient } from './OpenRouterClient';

/**
 * Manages multiple models and provides model selection logic
 */
export class ModelManager {
  private client: OpenRouterClient;
  private modelCapabilities: Map<string, ModelCapability> = new Map();

  constructor(apiKey: string) {
    this.client = new OpenRouterClient(apiKey);
    this.initializeModelCapabilities();
  }

  /**
   * Initialize model capabilities and metadata
   */
  private initializeModelCapabilities(): void {
    const capabilities = [
      {
        model: 'anthropic/claude-3.5-sonnet',
        capability: {
          strength: ['reasoning', 'analysis', 'code'],
          contextWindow: 200000,
          costTier: 'premium' as const,
          speed: 'medium' as const,
          specialties: ['complex reasoning', 'code analysis', 'writing']
        }
      },
      {
        model: 'openai/gpt-4-turbo',
        capability: {
          strength: ['general', 'code', 'creative'],
          contextWindow: 128000,
          costTier: 'premium' as const,
          speed: 'fast' as const,
          specialties: ['general purpose', 'code generation', 'creative writing']
        }
      },
      {
        model: 'mistralai/mistral-large',
        capability: {
          strength: ['code', 'reasoning', 'multilingual'],
          contextWindow: 32000,
          costTier: 'mid' as const,
          speed: 'fast' as const,
          specialties: ['code generation', 'multilingual', 'efficiency']
        }
      },
      {
        model: 'meta-llama/llama-3.1-405b',
        capability: {
          strength: ['reasoning', 'math', 'science'],
          contextWindow: 128000,
          costTier: 'premium' as const,
          speed: 'slow' as const,
          specialties: ['complex reasoning', 'mathematical analysis', 'scientific tasks']
        }
      },
      {
        model: 'meta-llama/llama-3.1-70b',
        capability: {
          strength: ['general', 'efficiency'],
          contextWindow: 128000,
          costTier: 'mid' as const,
          speed: 'medium' as const,
          specialties: ['balanced performance', 'cost-effective', 'general tasks']
        }
      },
      {
        model: 'google/gemini-pro-1.5',
        capability: {
          strength: ['multimodal', 'reasoning', 'code'],
          contextWindow: 1000000,
          costTier: 'mid' as const,
          speed: 'medium' as const,
          specialties: ['multimodal', 'large context', 'versatile']
        }
      }
    ];

    capabilities.forEach(({ model, capability }) => {
      this.modelCapabilities.set(model, capability);
    });
  }

  /**
   * Get the best model for a specific task type
   */
  getBestModelForTask(taskType: TaskType, preferences?: ModelPreferences): string {
    const availableModels = this.client.getAvailableModels();
    
    // Filter models based on preferences
    let candidateModels = availableModels.filter(model => {
      const capability = this.modelCapabilities.get(model);
      if (!capability) return false;

      // Check cost preference
      if (preferences?.maxCostTier) {
        const costOrder = { 'budget': 0, 'mid': 1, 'premium': 2 };
        const modelCost = costOrder[capability.costTier];
        const maxCost = costOrder[preferences.maxCostTier];
        if (modelCost > maxCost) return false;
      }

      // Check speed preference
      if (preferences?.minSpeed) {
        const speedOrder = { 'slow': 0, 'medium': 1, 'fast': 2 };
        const modelSpeed = speedOrder[capability.speed];
        const minSpeed = speedOrder[preferences.minSpeed];
        if (modelSpeed < minSpeed) return false;
      }

      return true;
    });

    if (candidateModels.length === 0) {
      candidateModels = availableModels; // Fallback to all models
    }

    // Score models based on task type
    const scoredModels = candidateModels.map(model => {
      const capability = this.modelCapabilities.get(model)!;
      let score = 0;

      // Task-specific scoring
      switch (taskType) {
        case 'code-generation':
          score += capability.strength.includes('code') ? 3 : 0;
          score += capability.specialties.includes('code generation') ? 2 : 0;
          break;
        case 'code-analysis':
          score += capability.strength.includes('code') ? 2 : 0;
          score += capability.strength.includes('reasoning') ? 2 : 0;
          score += capability.specialties.includes('code analysis') ? 3 : 0;
          break;
        case 'reasoning':
          score += capability.strength.includes('reasoning') ? 3 : 0;
          score += capability.specialties.includes('complex reasoning') ? 2 : 0;
          break;
        case 'creative':
          score += capability.strength.includes('creative') ? 3 : 0;
          score += capability.specialties.includes('creative writing') ? 2 : 0;
          break;
        case 'general':
          score += capability.strength.includes('general') ? 2 : 0;
          score += capability.specialties.includes('general purpose') ? 1 : 0;
          break;
        case 'multimodal':
          score += capability.strength.includes('multimodal') ? 3 : 0;
          score += capability.specialties.includes('multimodal') ? 2 : 0;
          break;
      }

      // Context window bonus for large tasks
      if (preferences?.requiresLargeContext) {
        if (capability.contextWindow >= 128000) score += 1;
        if (capability.contextWindow >= 500000) score += 2;
      }

      return { model, score };
    });

    // Sort by score and return the best model
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0]?.model || availableModels[0];
  }

  /**
   * Get model capability information
   */
  getModelCapability(model: string): ModelCapability | undefined {
    return this.modelCapabilities.get(model);
  }

  /**
   * Get all available models with their capabilities
   */
  getAllModelsWithCapabilities(): Array<{ model: string; capability: ModelCapability }> {
    return this.client.getAvailableModels().map(model => ({
      model,
      capability: this.modelCapabilities.get(model)!
    })).filter(item => item.capability);
  }

  /**
   * Recommend models for a user based on their usage patterns
   */
  recommendModels(usagePattern: UsagePattern): string[] {
    const allModels = this.getAllModelsWithCapabilities();
    
    // Score models based on usage pattern
    const scoredModels = allModels.map(({ model, capability }) => {
      let score = 0;

      // Primary use case scoring
      usagePattern.primaryUseCases.forEach(useCase => {
        if (capability.specialties.some(specialty => 
          specialty.toLowerCase().includes(useCase.toLowerCase())
        )) {
          score += 3;
        }
        if (capability.strength.some(strength => 
          strength.toLowerCase().includes(useCase.toLowerCase())
        )) {
          score += 2;
        }
      });

      // Budget consideration
      const costOrder = { 'budget': 3, 'mid': 2, 'premium': 1 };
      if (usagePattern.budgetSensitive) {
        score += costOrder[capability.costTier];
      }

      // Speed consideration
      const speedOrder = { 'fast': 3, 'medium': 2, 'slow': 1 };
      if (usagePattern.speedSensitive) {
        score += speedOrder[capability.speed];
      }

      return { model, score };
    });

    // Sort and return top 3 recommendations
    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels.slice(0, 3).map(item => item.model);
  }

  /**
   * Get the OpenRouter client instance
   */
  getClient(): OpenRouterClient {
    return this.client;
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this.client.dispose();
  }
}

// Supporting types
export interface ModelCapability {
  strength: string[];
  contextWindow: number;
  costTier: 'budget' | 'mid' | 'premium';
  speed: 'slow' | 'medium' | 'fast';
  specialties: string[];
}

export interface ModelPreferences {
  maxCostTier?: 'budget' | 'mid' | 'premium';
  minSpeed?: 'slow' | 'medium' | 'fast';
  requiresLargeContext?: boolean;
}

export type TaskType = 
  | 'code-generation'
  | 'code-analysis'
  | 'reasoning'
  | 'creative'
  | 'general'
  | 'multimodal';

export interface UsagePattern {
  primaryUseCases: string[];
  budgetSensitive: boolean;
  speedSensitive: boolean;
  contextRequirements: 'small' | 'medium' | 'large';
}