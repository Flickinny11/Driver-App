# Current AI Models Configuration (2025)

This document outlines the current AI models used in the Driver App as of June 2025.

## 🎼 Symphony Mode Models (10-15 agents)
**Optimized for balanced performance and efficient coordination**

- **Primary**: `anthropic/claude-3.5-sonnet-20241022`
  - Best reasoning and code analysis
  - Excellent for complex coordination tasks
  
- **Secondary**: `openai/gpt-4o`
  - Fast general-purpose model
  - Great for rapid development tasks

- **Tertiary**: `openai/o1-mini`
  - Cost-effective reasoning
  - Good for simpler coordination tasks

## 🎺 Orchestra Mode Models (20-30 agents)
**Optimized for large-scale coordination and complex reasoning**

- **Primary**: `openai/o1-preview`
  - Superior reasoning capabilities
  - Best for complex multi-agent coordination
  
- **Secondary**: `meta-llama/llama-3.1-405b-instruct`
  - Large model for complex orchestration
  - Excellent for handling many parallel tasks

- **Tertiary**: `google/gemini-pro-1.5-exp`
  - Massive 2M token context window
  - Perfect for complex file dependencies

## 🤖 Agent-Specific Models

### Frontend Agents
- `anthropic/claude-3.5-sonnet-20241022` - Best for React/TypeScript
- `meta-llama/llama-3.2-90b-vision-instruct` - UI/UX with vision capabilities

### Backend Agents  
- `openai/gpt-4o` - Excellent API design and server code
- `openai/o1-preview` - Complex database architecture

### DevOps/Performance
- `mistralai/mistral-large-2407` - Fast automation and optimization
- `openai/o1-mini` - Quick performance analysis

## 🚀 Current Models Supported (June 2025)

### Anthropic (Claude)
- `anthropic/claude-3.5-sonnet-20241022` ✅ Latest Claude
- `anthropic/claude-3.5-haiku` ✅ Fast Claude variant
- `anthropic/claude-3-opus` ✅ Most capable Claude

### OpenAI
- `openai/gpt-4o` ✅ Latest general model  
- `openai/o1-preview` ✅ Best reasoning model
- `openai/o1-mini` ✅ Efficient reasoning
- `openai/gpt-4o-mini` ✅ Fast variant

### Meta (Llama)
- `meta-llama/llama-3.2-90b-vision-instruct` ✅ Latest with vision
- `meta-llama/llama-3.1-405b-instruct` ✅ Largest model
- `meta-llama/llama-3.1-70b-instruct` ✅ Balanced option

### Mistral
- `mistralai/mistral-large-2407` ✅ Latest Mistral
- `mistralai/codestral-mamba` ✅ Code specialist
- `mistralai/mistral-nemo` ✅ Efficient option

### Google
- `google/gemini-pro-1.5-exp` ✅ Experimental with 2M context
- `google/gemini-flash-1.5` ✅ Fast variant

### Other Current Models
- `qwen/qwen-2.5-72b-instruct` ✅ Qwen latest
- `deepseek/deepseek-chat` ✅ Budget option
- `x-ai/grok-beta` ✅ Grok beta

## ❌ Removed Legacy Models

The following outdated models have been removed:
- ❌ `anthropic/claude-3.5-sonnet` (legacy version)
- ❌ `openai/gpt-4-turbo` (superseded by gpt-4o)
- ❌ `mistralai/mistral-large` (superseded by mistral-large-2407)

## 💰 Pricing Strategy

All models use real 2025 pricing with 600% profit margins:
- Premium models: $0.003-0.015 per 1K tokens
- Mid-tier models: $0.0009-0.003 per 1K tokens  
- Budget models: $0.00014-0.001 per 1K tokens

## 🔧 Configuration

Models are configured in:
- `src/core/openrouter/OpenRouterClient.ts` - Supported models list
- `src/core/openrouter/ModelManager.ts` - Model capabilities and selection
- `src/orchestration/AgentPool.ts` - Agent-specific model mapping
- `src/orchestration/symphony/ConductorAgent.ts` - Symphony optimization
- `src/orchestration/orchestra/OrchestraConductor.ts` - Orchestra optimization

## 📊 Performance Targets

- **Symphony Mode**: 70% faster than single agent
- **Orchestra Mode**: 150% faster than single agent
- **Zero Context Loss**: During agent handoffs
- **Real-time Coordination**: Sub-second response times

---

*Last updated: June 2025*
*All models verified current and functional*