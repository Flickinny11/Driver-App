import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus,
  Zap, 
  Cpu, 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Code,
  Play,
  MoreVertical
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
  const [selectedModel, setSelectedModel] = useState('symphony');
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
      icon: <Cpu className="h-4 w-4" />,
      speed: '~8s',
      description: '30 agents working in parallel, maximum quality'
    },
    { 
      value: 'claude-3.5-sonnet', 
      label: 'Claude 3.5 Sonnet',
      icon: <Code className="h-4 w-4" />,
      speed: '~5s',
      description: 'Excellent for complex reasoning and code analysis'
    },
    { 
      value: 'gpt-4-turbo', 
      label: 'GPT-4 Turbo',
      icon: <Cpu className="h-4 w-4" />,
      speed: '~6s',
      description: 'Latest OpenAI model with enhanced capabilities'
    },
    { 
      value: 'mistral-large', 
      label: 'Mistral Large',
      icon: <Zap className="h-4 w-4" />,
      speed: '~4s',
      description: 'European AI with strong multilingual support'
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
    <div className="flex h-full bg-gray-900">
      {/* Sidebar with History */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <motion.button 
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 hover:bg-blue-700 flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            New Chat
          </motion.button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          <ChatHistoryList />
        </div>
      </div>
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Model Selector */}
        <div className="bg-gray-800 p-4 border-b border-gray-700">
          <ModelSelector 
            value={selectedModel} 
            onChange={setSelectedModel}
            options={modelOptions}
          />
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
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
        <div className="bg-gray-800 p-4 border-t border-gray-700">
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
      <div className="w-80 bg-gray-800 border-l border-gray-700">
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
        className="flex items-center gap-3 bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-3 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.02 }}
      >
        {selectedOption?.icon}
        <div className="flex-1 text-left">
          <div className="text-white font-medium">{selectedOption?.label}</div>
          <div className="text-gray-400 text-sm">{selectedOption?.speed}</div>
        </div>
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-700 rounded-lg shadow-xl z-10 overflow-hidden"
          >
            {options.map((option) => (
              <motion.button
                key={option.value}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-600 transition-colors"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.8)' }}
              >
                {option.icon}
                <div className="flex-1 text-left">
                  <div className="text-white font-medium">{option.label}</div>
                  <div className="text-gray-400 text-sm">{option.description}</div>
                </div>
                <div className="text-xs text-blue-400">{option.speed}</div>
              </motion.button>
            ))}
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-gray-400 mb-6"
    >
      <div className="flex gap-1">
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span>AI is thinking...</span>
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
    <form onSubmit={handleSubmit} className="flex items-end gap-3">
      <div className="flex-1 bg-gray-700 rounded-lg border border-gray-600 focus-within:border-blue-500 transition-colors">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ask anything... Use @ to mention files, # for commands"
          className="w-full bg-transparent text-white placeholder-gray-400 p-3 resize-none focus:outline-none"
          rows={3}
          disabled={disabled}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        
        <div className="flex items-center justify-between p-3 pt-0">
          <div className="flex items-center gap-2">
            {features.includes('image') && (
              <motion.button
                type="button"
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <ImageIcon className="h-4 w-4" />
              </motion.button>
            )}
            {features.includes('voice') && (
              <motion.button
                type="button"
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Mic className="h-4 w-4" />
              </motion.button>
            )}
            {features.includes('code') && (
              <motion.button
                type="button"
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-600"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Paperclip className="h-4 w-4" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
      
      <motion.button
        type="submit"
        disabled={!value.trim() || disabled}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-3 rounded-lg"
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <Send className="h-5 w-5" />
      </motion.button>
    </form>
  );
};

const EmptyState: React.FC<{ selectedModel: string; modelOptions: ModelOption[] }> = ({ selectedModel, modelOptions }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="text-6xl mb-4">🚀</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        Ready to build something amazing?
      </h3>
      <p className="text-gray-400 max-w-md mx-auto">
        Using {modelOptions.find((m: ModelOption) => m.value === selectedModel)?.label} for maximum performance.
        Ask me to create apps, fix bugs, or explain code.
      </p>
    </motion.div>
  );
};

const ChatHistoryList: React.FC = () => {
  return (
    <div className="space-y-2">
      {/* This would be populated with actual chat history */}
      <div className="text-gray-400 text-sm p-2">No previous chats</div>
    </div>
  );
};

const ActiveBuildPanel: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-white font-semibold mb-4">Active Build</h3>
      <div className="text-gray-400 text-sm">
        No active builds
      </div>
    </div>
  );
};

export default CodeChatEnhanced;