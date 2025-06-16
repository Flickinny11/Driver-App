import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Zap, 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Code,
  Play,
  MoreVertical,
  Brain,
  Sparkles,
  Eye,
  Crown,
  Rocket,
  Star,
  Globe,
  Layers
} from 'lucide-react';
import type { Message } from '@/types';

interface ModelOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  speed: string;
  description: string;
}

export const CodeChatEnhanced: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3.5-sonnet-20241022');
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const modelOptions: ModelOption[] = [
    { 
      value: 'symphony', 
      label: 'Symphony (Fast)', 
      icon: <Zap className="h-4 w-4" />,
      speed: '~2s',
      description: 'Optimized for speed, perfect for quick iterations'
    },
    { 
      value: 'orchestra', 
      label: 'Orchestra (Powerful)', 
      icon: <Layers className="h-4 w-4" />,
      speed: '~8s',
      description: '30 agents working in parallel, maximum quality'
    },
    { 
      value: 'anthropic/claude-3.5-sonnet-20241022', 
      label: 'Claude 3.5 Sonnet (Latest)',
      icon: <Crown className="h-4 w-4" />,
      speed: '~4s',
      description: 'Latest Claude with enhanced reasoning and coding abilities'
    },
    { 
      value: 'openai/gpt-4o', 
      label: 'GPT-4o',
      icon: <Brain className="h-4 w-4" />,
      speed: '~3s',
      description: 'OpenAI\'s most advanced multimodal model'
    },
    { 
      value: 'openai/o1-preview', 
      label: 'OpenAI o1 Preview',
      icon: <Sparkles className="h-4 w-4" />,
      speed: '~15s',
      description: 'Advanced reasoning model for complex problems'
    },
    { 
      value: 'anthropic/claude-3.5-haiku', 
      label: 'Claude 3.5 Haiku',
      icon: <Zap className="h-4 w-4" />,
      speed: '~2s',
      description: 'Fast and efficient Claude variant'
    },
    { 
      value: 'meta-llama/llama-3.2-90b-vision-instruct', 
      label: 'Llama 3.2 90B Vision',
      icon: <Eye className="h-4 w-4" />,
      speed: '~6s',
      description: 'Powerful vision-capable open source model'
    },
    { 
      value: 'mistralai/mistral-large-2407', 
      label: 'Mistral Large',
      icon: <Star className="h-4 w-4" />,
      speed: '~4s',
      description: 'European AI with strong multilingual support'
    },
    { 
      value: 'google/gemini-pro-1.5-exp', 
      label: 'Gemini Pro 1.5 Exp',
      icon: <Globe className="h-4 w-4" />,
      speed: '~5s',
      description: 'Google\'s experimental multimodal model'
    },
    { 
      value: 'x-ai/grok-beta', 
      label: 'Grok Beta',
      icon: <Rocket className="h-4 w-4" />,
      speed: '~7s',
      description: 'xAI\'s conversational AI with real-time data'
    }
  ];

  const handleSend = async (content: string, attachments?: File[]) => {
    if (!content.trim() && !attachments?.length) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
      metadata: {
        model: selectedModel
      }
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsStreaming(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I'll help you with that using ${modelOptions.find(m => m.value === selectedModel)?.label}. Here's my response...`,
        timestamp: new Date(),
        agentId: selectedModel === 'orchestra' ? 'orchestra-conductor' : selectedModel,
        metadata: {
          model: selectedModel,
          tokens: 150,
          cost: 0.003,
          latency: 2500
        }
      };
      
      setMessages(prev => [...prev, aiResponse]);
      setIsStreaming(false);
    }, 2000);
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-30"></div>
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
      
      {/* Sidebar with History */}
      <div className="w-80 glass-card border-r border-white/10 flex flex-col relative z-10 m-2 mr-1 rounded-2xl">
        <div className="p-6 border-b border-white/10">
          <motion.button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl px-6 py-4 hover:from-blue-600 hover:to-purple-700 flex items-center justify-center gap-3 font-medium shadow-lg shadow-blue-500/25"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Plus className="h-5 w-5" />
            New Chat
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          <ChatHistoryList />
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10 m-2 mx-1">
        {/* Model Selector */}
        <div className="glass-card p-6 border-b border-white/10 rounded-t-2xl">
          <ModelSelector 
            value={selectedModel} 
            onChange={setSelectedModel}
            options={modelOptions}
          />
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 glass-card rounded-none border-x border-white/10">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                showActions={true}
              />
            ))}
          </AnimatePresence>
          
          {isStreaming && <StreamingIndicator />}
          
          {messages.length === 0 && (
            <EmptyState selectedModel={selectedModel} modelOptions={modelOptions} />
          )}
        </div>
        
        {/* Input Area */}
        <div className="glass-card p-6 border-t border-white/10 rounded-b-2xl">
          <ChatInput 
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            features={['voice', 'image', 'code', 'video']}
            disabled={isStreaming}
          />
        </div>
      </div>
      
      {/* Right Panel - Active Build */}
      <div className="w-80 glass-card border-l border-white/10 relative z-10 m-2 ml-1 rounded-2xl">
        <ActiveBuildPanel />
      </div>
    </div>
  );
};

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: ModelOption[];
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative">
      <motion.button
        className="flex items-center gap-4 glass-button rounded-xl px-6 py-4 w-full transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
          {selectedOption?.icon}
        </div>
        <div className="flex-1 text-left">
          <div className="text-white font-semibold text-lg">{selectedOption?.label}</div>
          <div className="text-white/70 text-sm flex items-center gap-2">
            <span>{selectedOption?.speed}</span>
            <span className="text-white/40">•</span>
            <span>{selectedOption?.description}</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <MoreVertical className="h-5 w-5 text-white/60" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute top-full left-0 right-0 mt-3 glass-card rounded-xl shadow-2xl z-20 overflow-hidden border border-white/10"
          >
            <div className="max-h-80 overflow-y-auto">
              {options.map((option, index) => (
                <motion.button
                  key={option.value}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-all duration-200 border-b border-white/5 last:border-b-0"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    {option.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{option.label}</div>
                    <div className="text-white/60 text-sm">{option.description}</div>
                  </div>
                  <div className="text-xs text-blue-400 font-medium bg-blue-500/20 px-2 py-1 rounded-md">{option.speed}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  showActions: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, showActions }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-3xl ${isUser ? 'ml-12' : 'mr-12'}`}>
        <div className={`rounded-xl p-4 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-800 text-white border border-gray-700'
        }`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          
          {message.metadata && (
            <div className="mt-3 text-xs opacity-70 flex items-center gap-4">
              <span>Model: {message.metadata.model}</span>
              {message.metadata.tokens && <span>Tokens: {message.metadata.tokens}</span>}
              {message.metadata.latency && <span>Time: {message.metadata.latency}ms</span>}
            </div>
          )}
        </div>
        
        {showActions && !isUser && (
          <div className="flex items-center gap-2 mt-2">
            <motion.button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Code className="h-4 w-4" />
            </motion.button>
            <motion.button
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Play className="h-4 w-4" />
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const StreamingIndicator: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 text-white/70 mb-8 p-4 glass-button rounded-xl"
    >
      <div className="flex gap-2">
        <motion.div
          className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4] 
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4] 
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-3 h-3 bg-gradient-to-r from-pink-400 to-red-500 rounded-full"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.4, 1, 0.4] 
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span className="text-lg">AI is thinking...</span>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="ml-auto"
      >
        <Brain className="h-5 w-5 text-blue-400" />
      </motion.div>
    </motion.div>
  );
};

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string, files?: File[]) => void;
  features: string[];
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  features,
  disabled 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-4">
      <div className="flex-1 glass-button rounded-2xl border border-white/20 focus-within:border-blue-400/50 transition-all duration-300 focus-within:shadow-lg focus-within:shadow-blue-500/20">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything... Use @ to mention files, # for commands"
          className="w-full bg-transparent text-white placeholder-white/40 p-6 resize-none focus:outline-none text-lg"
          rows={3}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        <div className="flex items-center justify-between p-6 pt-0">
          <div className="flex items-center gap-3">
            {features.includes('image') && (
              <motion.button
                type="button"
                className="p-3 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ImageIcon className="h-5 w-5" />
              </motion.button>
            )}
            {features.includes('voice') && (
              <motion.button
                type="button"
                className="p-3 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Mic className="h-5 w-5" />
              </motion.button>
            )}
            {features.includes('code') && (
              <motion.button
                type="button"
                className="p-3 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-all duration-200"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Paperclip className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      <motion.button
        type="submit"
        disabled={!value.trim() || disabled}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white p-4 rounded-xl shadow-lg disabled:shadow-none"
        whileHover={{ scale: disabled ? 1 : 1.05, y: disabled ? 0 : -2 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        <Send className="h-6 w-6" />
      </motion.button>
    </form>
  );
};

const EmptyState: React.FC<{ selectedModel: string; modelOptions: ModelOption[] }> = ({ selectedModel, modelOptions }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center py-16"
    >
      <motion.div 
        className="text-8xl mb-6"
        animate={{ 
          rotate: [0, 10, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      >
        🚀
      </motion.div>
      <h3 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Ready to build something amazing?
      </h3>
      <p className="text-white/70 max-w-lg mx-auto text-lg leading-relaxed">
        Using <span className="text-blue-400 font-semibold">{modelOptions.find((m: ModelOption) => m.value === selectedModel)?.label}</span> for maximum performance.
        Ask me to create apps, fix bugs, or explain code.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {['Create an app', 'Debug code', 'Explain concept', 'Write tests'].map((suggestion, index) => (
          <motion.button
            key={suggestion}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + index * 0.1 }}
            className="glass-button px-4 py-2 rounded-lg text-white/80 hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.05, y: -2 }}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

const ChatHistoryList: React.FC = () => {
  const sampleChats = [
    { title: "React Component Help", time: "2 hours ago", active: true },
    { title: "Python API Debug", time: "Yesterday", active: false },
    { title: "Database Design", time: "3 days ago", active: false },
  ];

  return (
    <div className="space-y-3">
      <h4 className="text-white/80 font-medium text-sm uppercase tracking-wider px-2">Recent Chats</h4>
      {sampleChats.map((chat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
            chat.active 
              ? 'glass-button border border-blue-400/30 bg-blue-500/10' 
              : 'hover:bg-white/5'
          }`}
          whileHover={{ x: 4, scale: 1.02 }}
        >
          <div className="text-white font-medium text-sm truncate">{chat.title}</div>
          <div className="text-white/50 text-xs mt-1">{chat.time}</div>
        </motion.div>
      ))}
      <div className="text-white/40 text-sm p-3 text-center mt-8">
        More history coming soon...
      </div>
    </div>
  );
};

const ActiveBuildPanel: React.FC = () => {
  return (
    <div className="p-6">
      <h3 className="text-white font-bold text-xl mb-6 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-green-500/20 to-blue-500/20">
          <Play className="h-5 w-5 text-green-400" />
        </div>
        Active Build
      </h3>
      <div className="glass-button p-6 rounded-xl text-center">
        <div className="text-6xl mb-4">⚡</div>
        <div className="text-white/60 text-sm mb-4">
          No active builds
        </div>
        <motion.button
          className="glass-button px-4 py-2 rounded-lg text-white/80 hover:text-white transition-colors"
          whileHover={{ scale: 1.05, y: -2 }}
        >
          Start a new project
        </motion.button>
      </div>
    </div>
  );
};

export default CodeChatEnhanced;