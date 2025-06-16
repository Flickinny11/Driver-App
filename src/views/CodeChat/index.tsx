import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Download, Copy } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { AppCore } from '@/core/architecture/AppCore';
import { generateId } from '@/lib/utils';
import type { Message } from '@/types';

/**
 * Code Chat view - AI-powered coding assistant
 */
const CodeChatView = () => {
  const { addToast, selectedModel } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: generateId('msg'),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: generateId('msg'),
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const core = AppCore.getInstance();
      
      if (!core.openRouter) {
        throw new Error('AI services not initialized. Please check your API key.');
      }

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      // Stream response
      await core.openRouter.streamCompletion(
        selectedModel,
        [userMessage],
        (token: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: msg.content + token }
                : msg
            )
          );
        },
        () => {
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        (error: Error) => {
          console.error('Streaming error:', error);
          addToast({
            type: 'error',
            title: 'AI Response Error',
            description: error.message
          });
          setIsStreaming(false);
          abortControllerRef.current = null;
        },
        abortControllerRef.current.signal
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      addToast({
        type: 'error',
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Remove the empty assistant message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessage.id));
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      addToast({
        type: 'success',
        title: 'Copied to clipboard',
        description: 'Message content copied successfully'
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-30"></div>
      <div className="absolute inset-0 backdrop-blur-3xl"></div>
      
      {/* Header */}
      <motion.div 
        className="glass-card border-b border-white/10 p-6 m-4 mb-2 rounded-2xl relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Code Chat</h1>
            <p className="text-white/70">AI-powered coding assistant</p>
          </div>
          <div className="text-sm text-white/60 glass-button px-4 py-2 rounded-xl">
            Model: <span className="text-blue-400 font-medium">{selectedModel}</span>
          </div>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 mx-4 space-y-6 glass-card rounded-2xl border border-white/10 relative z-10">
        {messages.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
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
              <Bot className="h-20 w-20 text-blue-400 mx-auto mb-6" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Start a conversation</h3>
            <p className="text-white/70 max-w-lg mx-auto text-lg leading-relaxed">
              Ask me about coding, get help with debugging, or discuss software architecture.
              I'm here to help with all your development needs.
            </p>
          </motion.div>
        )}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>

              {/* Message bubble */}
              <div className={`glass-card p-4 ${
                message.role === 'user' 
                  ? 'bg-primary/10 border-primary/20' 
                  : 'bg-card'
              }`}>
                <div className="prose prose-invert max-w-none">
                  {message.content.includes('```') ? (
                    // Render code blocks
                    <pre className="bg-muted p-3 rounded-lg overflow-x-auto">
                      <code>{message.content}</code>
                    </pre>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>

                {/* Message actions */}
                {message.content && (
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 rounded hover:bg-accent transition-colors"
                      title="Copy message"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {message.content.includes('```') && (
                      <button
                        onClick={() => {/* Download code */}}
                        className="p-1 rounded hover:bg-accent transition-colors"
                        title="Download code"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isStreaming && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={handleStopGeneration}
              className="btn-secondary px-4 py-2"
            >
              Stop Generation
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <motion.div 
        className="p-6 m-4 mt-2 glass-card rounded-2xl border-t border-white/10 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about coding..."
              className="w-full bg-white/5 border border-white/20 rounded-xl px-6 py-4 text-white placeholder-white/40 min-h-[80px] resize-none pr-16 focus:outline-none focus:border-blue-400/50 transition-all duration-300"
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isStreaming}
              className="absolute right-3 bottom-3 p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:shadow-none shadow-lg"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center mt-3 text-xs text-white/50">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{input.length} characters</span>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeChatView;